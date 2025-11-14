const { db, admin } = require('../firebase');

// Get all rental equipment
exports.getAllRentals = async (req, res) => {
  try {
    const { category, isAvailable, location, search } = req.query;
    let query = db.collection('rentalEquipment');

    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    // Filter by availability if provided
    if (isAvailable !== undefined) {
      query = query.where('isAvailable', '==', isAvailable === 'true');
    }

    // Filter by location if provided
    if (location) {
      query = query.where('location', '==', location);
    }

    const snap = await query.get();
    let rentals = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      rentals = rentals.filter(rental =>
        rental.name?.toLowerCase().includes(searchLower) ||
        rental.description?.toLowerCase().includes(searchLower) ||
        rental.location?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by rating (descending) by default
    rentals.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return res.status(200).json({
      success: true,
      message: 'Rental equipment retrieved successfully',
      data: rentals,
      count: rentals.length
    });
  } catch (error) {
    console.error('Get all rentals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Get single rental equipment by ID
exports.getRental = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('rentalEquipment').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Rental equipment not found',
        error: 'Equipment does not exist'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Rental equipment retrieved successfully',
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Get rental error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Create new rental equipment
exports.createRental = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      rentalPrice,
      rentalUnit,
      image,
      rating,
      reviews,
      isAvailable,
      location,
      specifications
    } = req.body;

    // Validation
    if (!name || !category || !rentalPrice || !location) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Name, category, rentalPrice, and location are required'
      });
    }

    // Validate category
    const validCategories = ['tractor', 'harvester', 'plow', 'irrigation', 'sprayer', 'tiller', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const rentalData = {
      name,
      category,
      description: description || '',
      rentalPrice,
      rentalUnit: rentalUnit || 'per day',
      image: image || '',
      rating: rating || 0,
      reviews: reviews || 0,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      location,
      specifications: specifications || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('rentalEquipment').add(rentalData);

    return res.status(201).json({
      success: true,
      message: 'Rental equipment created successfully',
      data: {
        id: docRef.id,
        ...rentalData
      }
    });
  } catch (error) {
    console.error('Create rental error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Update rental equipment
exports.updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if rental equipment exists
    const doc = await db.collection('rentalEquipment').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Rental equipment not found',
        error: 'Equipment does not exist'
      });
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['tractor', 'harvester', 'plow', 'irrigation', 'sprayer', 'tiller', 'other'];
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

    await db.collection('rentalEquipment').doc(id).update(updateData);

    // Get updated rental equipment
    const updatedDoc = await db.collection('rentalEquipment').doc(id).get();

    return res.status(200).json({
      success: true,
      message: 'Rental equipment updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update rental error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Delete rental equipment
exports.deleteRental = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rental equipment exists
    const doc = await db.collection('rentalEquipment').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Rental equipment not found',
        error: 'Equipment does not exist'
      });
    }

    await db.collection('rentalEquipment').doc(id).delete();

    return res.status(200).json({
      success: true,
      message: 'Rental equipment deleted successfully'
    });
  } catch (error) {
    console.error('Delete rental error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

