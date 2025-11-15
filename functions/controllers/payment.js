const { db, admin } = require('../firebase');
const { PaymentServiceFactory } = require('../services/paymentService');

// Create payment (initiate payment)
exports.createPayment = async (req, res) => {
  try {
    const { userId, fullName, email, userType } = req.user;
    const { orderId, amount, currency, paymentMethod, gateway } = req.body;

    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Order ID is required',
        errors: {
          orderId: 'Order ID is required'
        }
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Amount is required and must be greater than 0',
        errors: {
          amount: 'Amount must be a positive number'
        }
      });
    }

    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const orderData = orderDoc.data();

    // Verify order belongs to user
    if (orderData.farmerId !== userId && orderData.merchantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to pay for this order'
      });
    }

    // Check if payment already exists
    const existingPaymentQuery = await db.collection('payments')
      .where('orderId', '==', orderId)
      .where('status', 'in', ['created', 'pending', 'processing'])
      .limit(1)
      .get();

    if (!existingPaymentQuery.empty) {
      const existingPayment = existingPaymentQuery.docs[0].data();
      return res.status(400).json({
        success: false,
        error: 'Payment Already Exists',
        message: 'A payment is already in progress for this order',
        data: {
          paymentId: existingPaymentQuery.docs[0].id,
          ...existingPayment
        }
      });
    }

    // Get payment service
    const paymentGateway = gateway || process.env.PAYMENT_GATEWAY || 'dummy';
    const paymentService = PaymentServiceFactory.getService(paymentGateway);

    // Create payment with gateway
    const paymentData = {
      orderId,
      amount,
      currency: currency || 'INR',
      customerName: fullName,
      email: email || orderData.farmerEmail || '',
      phone: orderData.farmerPhone || '',
      description: `Payment for order ${orderId}`,
      orderType: orderData.orderType
    };

    const paymentResponse = await paymentService.createPayment(paymentData);

    // Save payment to database
    const paymentRecord = {
      orderId,
      farmerId: orderData.farmerId,
      merchantId: orderData.merchantId,
      amount: Number(amount),
      currency: currency || 'INR',
      paymentMethod: paymentMethod || 'online',
      gateway: paymentGateway,
      paymentId: paymentResponse.paymentId,
      status: 'created',
      orderType: orderData.orderType,
      paymentData: paymentResponse.paymentData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const paymentDocRef = await db.collection('payments').add(paymentRecord);
    const paymentRecordId = paymentDocRef.id;

    return res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        id: paymentRecordId,
        ...paymentRecord,
        checkoutUrl: paymentResponse.checkoutUrl,
        testPaymentUrl: paymentResponse.testPaymentUrl // For testing
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Verify payment (callback from payment gateway)
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, paymentData } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Payment ID is required'
      });
    }

    // Get payment record
    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Payment not found'
      });
    }

    const paymentRecord = paymentDoc.data();

    // Get payment service
    const paymentService = PaymentServiceFactory.getService(paymentRecord.gateway);

    // Verify payment with gateway
    const verificationResult = await paymentService.verifyPayment(
      paymentRecord.paymentId,
      paymentData || req.body
    );

    // Update payment record
    const updateData = {
      status: verificationResult.status === 'captured' || verificationResult.status === 'SUCCESS' 
        ? 'success' 
        : 'failed',
      paymentStatus: verificationResult.status,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationData: verificationResult,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('payments').doc(paymentId).update(updateData);

    // If payment successful, update order
    if (updateData.status === 'success') {
      await db.collection('orders').doc(paymentRecord.orderId).update({
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const updatedPayment = await db.collection('payments').doc(paymentId).get();

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        id: paymentId,
        ...updatedPayment.data()
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Payment not found'
      });
    }

    const paymentRecord = paymentDoc.data();

    // Optionally check with gateway for latest status
    const paymentService = PaymentServiceFactory.getService(paymentRecord.gateway);
    const gatewayStatus = await paymentService.getPaymentStatus(paymentRecord.paymentId);

    return res.status(200).json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        id: paymentId,
        ...paymentRecord,
        gatewayStatus
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get payments by order
exports.getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;

    // Get order to verify access
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const orderData = orderDoc.data();
    if (orderData.farmerId !== userId && orderData.merchantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view payments for this order'
      });
    }

    const paymentsQuery = await db.collection('payments')
      .where('orderId', '==', orderId)
      .get();

    const payments = paymentsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Get payments by order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const { userId, userType } = req.user;

    // Only merchants can process refunds
    if (userType !== 'merchant') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only merchants can process refunds'
      });
    }

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Payment not found'
      });
    }

    const paymentRecord = paymentDoc.data();

    // Verify merchant owns this payment
    if (paymentRecord.merchantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to refund this payment'
      });
    }

    // Check payment status
    if (paymentRecord.status !== 'success') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Only successful payments can be refunded'
      });
    }

    // Get payment service
    const paymentService = PaymentServiceFactory.getService(paymentRecord.gateway);
    const refundAmount = amount || paymentRecord.amount;

    // Process refund with gateway
    const refundResult = await paymentService.refundPayment(
      paymentRecord.paymentId,
      refundAmount
    );

    // Create refund record
    const refundRecord = {
      paymentId,
      orderId: paymentRecord.orderId,
      amount: refundAmount,
      reason: reason || 'Customer request',
      status: 'processed',
      refundId: refundResult.refundId,
      processedBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('refunds').add(refundRecord);

    // Update payment record
    await db.collection('payments').doc(paymentId).update({
      refundStatus: 'refunded',
      refundAmount: refundAmount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refundRecord
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

