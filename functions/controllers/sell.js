const { db, admin } = require('../firebase');

// Create product listing
exports.createSellProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      unit,
      quantity,
      stock,
      image,
      status
    } = req.body;

    // Get user info from authenticated request
    const { userId, fullName } = req.user;

    // Create product data
    const productData = {
      name,
      description: description || '',
      category,
      price: Number(price),
      unit,
      quantity: Number(quantity),
      stock: Number(stock),
      image: image || '',
      sellerId: userId,
      sellerName: fullName,
      status: status || 'Active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('sellProducts').add(productData);
    const productId = docRef.id;

    // Get the created document with timestamps
    const createdDoc = await db.collection('sellProducts').doc(productId).get();
    const createdData = createdDoc.data();

    return res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      data: {
        id: productId,
        ...createdData
      }
    });
  } catch (error) {
    console.error('Create sell product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get all sell products (with filters)
exports.getAllSellProducts = async (req, res) => {
  try {
    const { category, status, sellerId, search } = req.query;
    let query = db.collection('sellProducts');

    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    // Filter by sellerId if provided
    if (sellerId) {
      query = query.where('sellerId', '==', sellerId);
    }

    const snap = await query.get();
    let products = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.sellerName?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt (newest first)
    products.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get all sell products error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get single sell product by ID
exports.getSellProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const doc = await db.collection('sellProducts').doc(productId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Get sell product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Update product listing
exports.updateSellProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    const { userId } = req.user;

    // Check if product exists
    const doc = await db.collection('sellProducts').doc(productId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    const productData = doc.data();

    // Check if user owns this product
    if (productData.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this product'
      });
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['grains', 'vegetables', 'fruits', 'pulses', 'spices', 'other'];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid category',
          errors: {
            category: `Category must be one of: ${validCategories.join(', ')}`
          }
        });
      }
    }

    // Validate unit if provided
    if (updateData.unit) {
      const validUnits = ['kg', 'quintal', 'ton', 'bag', 'piece'];
      if (!validUnits.includes(updateData.unit)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid unit',
          errors: {
            unit: `Unit must be one of: ${validUnits.join(', ')}`
          }
        });
      }
    }

    // Convert numeric fields if provided
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
      if (isNaN(updateData.price) || updateData.price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid price',
          errors: {
            price: 'Price must be a number greater than 0'
          }
        });
      }
    }

    if (updateData.quantity !== undefined) {
      updateData.quantity = Number(updateData.quantity);
      if (isNaN(updateData.quantity) || updateData.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid quantity',
          errors: {
            quantity: 'Quantity must be a number greater than 0'
          }
        });
      }
    }

    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
      if (isNaN(updateData.stock) || updateData.stock <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid stock',
          errors: {
            stock: 'Stock must be a number greater than 0'
          }
        });
      }
    }

    // Add updated timestamp
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Don't allow updating sellerId or sellerName
    delete updateData.sellerId;
    delete updateData.sellerName;

    await db.collection('sellProducts').doc(productId).update(updateData);

    // Get updated product
    const updatedDoc = await db.collection('sellProducts').doc(productId).get();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update sell product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Delete product listing
exports.deleteSellProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.user;

    // Check if product exists
    const doc = await db.collection('sellProducts').doc(productId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    const productData = doc.data();

    // Check if user owns this product
    if (productData.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete this product'
      });
    }

    await db.collection('sellProducts').doc(productId).delete();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete sell product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

