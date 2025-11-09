const { db, admin } = require('../firebase');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, inStock, search } = req.query;
    let query = db.collection('products');

    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    // Filter by stock status if provided
    if (inStock !== undefined) {
      query = query.where('inStock', '==', inStock === 'true');
    }

    const snap = await query.get();
    let products = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Search filter (client-side for simplicity, can be optimized with Firestore queries)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by rating (descending) by default
    products.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get all products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'Product does not exist'
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
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      unit,
      image,
      rating,
      reviews,
      inStock
    } = req.body;

    // Validation
    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Name, category, and price are required'
      });
    }

    // Validate category
    const validCategories = ['seeds', 'fertilizers', 'pesticides', 'tools', 'equipment'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const productData = {
      name,
      category,
      description: description || '',
      price,
      unit: unit || 'per piece',
      image: image || '',
      rating: rating || 0,
      reviews: reviews || 0,
      inStock: inStock !== undefined ? inStock : true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('products').add(productData);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: docRef.id,
        ...productData
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'Product does not exist'
      });
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['seeds', 'fertilizers', 'pesticides', 'tools', 'equipment'];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: `Category must be one of: ${validCategories.join(', ')}`
        });
      }
    }

    // Add updated timestamp
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('products').doc(id).update(updateData);

    // Get updated product
    const updatedDoc = await db.collection('products').doc(id).get();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'Product does not exist'
      });
    }

    await db.collection('products').doc(id).delete();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

