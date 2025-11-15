const { db, admin } = require('../firebase');

// Create order (Farmer only)
exports.createOrder = async (req, res) => {
  try {
    const { userId, fullName, userType } = req.user;

    // Only farmers can create orders
    if (userType !== 'farmer') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only farmers can create orders'
      });
    }

    const {
      orderType,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      deliveryAddress,
      merchantId,
      merchantName,
      notes
    } = req.body;

    // Validation - Order Type
    const validOrderTypes = ['buy', 'sell', 'rent'];
    if (!orderType || typeof orderType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Order type is required',
        errors: {
          orderType: 'Order type must be one of: buy, sell, rent'
        }
      });
    }

    if (!validOrderTypes.includes(orderType)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid order type',
        errors: {
          orderType: `Order type must be one of: ${validOrderTypes.join(', ')}`
        }
      });
    }

    // Validation - Items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Items array is required and must not be empty',
        errors: {
          items: 'At least one item is required'
        }
      });
    }

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Total amount is required and must be greater than 0',
        errors: {
          totalAmount: 'Total amount must be a positive number'
        }
      });
    }

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Merchant ID is required',
        errors: {
          merchantId: 'Merchant ID is required'
        }
      });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId || !item.productName || !item.quantity || !item.price) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Item ${i + 1} is missing required fields`,
          errors: {
            items: 'Each item must have productId, productName, quantity, and price'
          }
        });
      }
    }

    // Determine order status based on payment
    // If payment is done (card/UPI), order is confirmed, else pending
    const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed';
    const orderStatus = isPaid ? 'confirmed' : 'pending';

    // Create order data
    const orderData = {
      orderType, // 'buy', 'sell', 'rent'
      farmerId: userId,
      farmerName: fullName,
      merchantId,
      merchantName: merchantName || '',
      items,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'pending', // 'card', 'upi', 'cash', 'pending'
      paymentStatus: paymentStatus || 'pending', // 'pending', 'paid', 'completed', 'failed'
      orderStatus, // 'pending', 'confirmed', 'cancelled', 'delivered'
      deliveryAddress: deliveryAddress || {},
      notes: notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('orders').add(orderData);
    const orderId = docRef.id;

    // Get the created order
    const createdDoc = await db.collection('orders').doc(orderId).get();
    const createdData = createdDoc.data();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: orderId,
        ...createdData
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get orders (Farmer sees their own, Merchant sees all)
exports.getOrders = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { status, paymentStatus, merchantId, farmerId, orderType } = req.query;

    let query = db.collection('orders');

    // Farmers see only their orders
    if (userType === 'farmer') {
      query = query.where('farmerId', '==', userId);
    }
    // Merchants see all orders
    else if (userType === 'merchant') {
      // Optional: filter by merchantId if provided
      if (merchantId) {
        query = query.where('merchantId', '==', merchantId);
      }
    }
    // Admin or other roles can see all
    else {
      // Optional filters
      if (farmerId) {
        query = query.where('farmerId', '==', farmerId);
      }
      if (merchantId) {
        query = query.where('merchantId', '==', merchantId);
      }
    }

    const snap = await query.get();
    let orders = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by order type if provided
    if (orderType) {
      const validOrderTypes = ['buy', 'sell', 'rent'];
      if (validOrderTypes.includes(orderType)) {
        orders = orders.filter(order => order.orderType === orderType);
      }
    }

    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.orderStatus === status);
    }

    // Filter by payment status if provided
    if (paymentStatus) {
      orders = orders.filter(order => order.paymentStatus === paymentStatus);
    }

    // Sort by createdAt (newest first)
    orders.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get single order by ID
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, userType } = req.user;

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const orderData = doc.data();

    // Check access permissions
    if (userType === 'farmer' && orderData.farmerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this order'
      });
    }

    if (userType === 'merchant' && orderData.merchantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this order'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        id: doc.id,
        ...orderData
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Update order (Payment update by Farmer, Status update by Merchant)
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, userType } = req.user;
    const updateData = req.body;

    // Check if order exists
    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const orderData = doc.data();

    // Farmers can update payment status
    if (userType === 'farmer') {
      if (orderData.farmerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to update this order'
        });
      }

      // Farmers can only update payment-related fields
      const allowedFields = ['paymentMethod', 'paymentStatus'];
      const updateFields = Object.keys(updateData);
      const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Farmers can only update paymentMethod and paymentStatus',
          errors: {
            fields: `Invalid fields: ${invalidFields.join(', ')}`
          }
        });
      }

      // If payment is updated to paid/completed, update order status to confirmed
      if (updateData.paymentStatus === 'paid' || updateData.paymentStatus === 'completed') {
        updateData.orderStatus = 'confirmed';
      }
    }
    // Merchants can update order status and confirm orders
    else if (userType === 'merchant') {
      if (orderData.merchantId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to update this order'
        });
      }

      // Merchants can update order status, payment status, and order type (for offline payments)
      const allowedFields = ['orderStatus', 'paymentStatus', 'orderType', 'notes'];
      const updateFields = Object.keys(updateData);
      const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Merchants can only update orderStatus, paymentStatus, and notes',
          errors: {
            fields: `Invalid fields: ${invalidFields.join(', ')}`
          }
        });
      }

      // If merchant confirms order, ensure payment is done
      if (updateData.orderStatus === 'confirmed') {
        if (orderData.paymentStatus !== 'paid' && orderData.paymentStatus !== 'completed' && 
            updateData.paymentStatus !== 'paid' && updateData.paymentStatus !== 'completed') {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Order can only be confirmed if payment is completed',
            errors: {
              orderStatus: 'Payment must be completed before confirming order'
            }
          });
        }
        // Set payment status to paid if confirming
        if (!updateData.paymentStatus) {
          updateData.paymentStatus = 'paid';
        }
      }
    }
    // Admin can update anything
    else {
      // Admin can update all fields
    }

    // Validate order status
    if (updateData.orderStatus) {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'delivered'];
      if (!validStatuses.includes(updateData.orderStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid order status',
          errors: {
            orderStatus: `Status must be one of: ${validStatuses.join(', ')}`
          }
        });
      }
    }

    // Validate payment status
    if (updateData.paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'completed', 'failed'];
      if (!validPaymentStatuses.includes(updateData.paymentStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid payment status',
          errors: {
            paymentStatus: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`
          }
        });
      }
    }

    // Validate order type
    if (updateData.orderType) {
      const validOrderTypes = ['buy', 'sell', 'rent'];
      if (!validOrderTypes.includes(updateData.orderType)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid order type',
          errors: {
            orderType: `Order type must be one of: ${validOrderTypes.join(', ')}`
          }
        });
      }
    }

    // Add updated timestamp
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('orders').doc(orderId).update(updateData);

    // Get updated order
    const updatedDoc = await db.collection('orders').doc(orderId).get();

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Cancel order (Farmer only)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, userType } = req.user;

    // Only farmers can cancel their own orders
    if (userType !== 'farmer') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only farmers can cancel orders'
      });
    }

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const orderData = doc.data();

    if (orderData.farmerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only cancel your own orders'
      });
    }

    // Can only cancel pending or confirmed orders
    if (orderData.orderStatus === 'delivered' || orderData.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Cannot cancel order with status: ${orderData.orderStatus}`
      });
    }

    await db.collection('orders').doc(orderId).update({
      orderStatus: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedDoc = await db.collection('orders').doc(orderId).get();

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

