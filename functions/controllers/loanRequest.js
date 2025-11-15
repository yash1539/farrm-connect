const { db, admin } = require('../firebase');

// Generate unique IDs
const generateRequestId = () => {
  return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const generateTicketId = () => {
  return `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Find M2 merchant based on PIN code/village
const findM2Merchant = async (pincode, village) => {
  try {
    // First, try to find merchant by PIN code
    if (pincode) {
      const merchantByPinQuery = await db.collection('merchants')
        .where('userType', '==', 'merchant')
        .where('merchantType', '==', 'M2')
        .where('servicePincodes', 'array-contains', pincode)
        .limit(1)
        .get();

      if (!merchantByPinQuery.empty) {
        const merchant = merchantByPinQuery.docs[0];
        return {
          merchantId: merchant.id,
          merchantName: merchant.data().fullName || merchant.data().name || 'M2 Merchant'
        };
      }
    }

    // If not found by PIN, try by village
    if (village) {
      const merchantByVillageQuery = await db.collection('merchants')
        .where('userType', '==', 'merchant')
        .where('merchantType', '==', 'M2')
        .where('serviceVillages', 'array-contains', village)
        .limit(1)
        .get();

      if (!merchantByVillageQuery.empty) {
        const merchant = merchantByVillageQuery.docs[0];
        return {
          merchantId: merchant.id,
          merchantName: merchant.data().fullName || merchant.data().name || 'M2 Merchant'
        };
      }
    }

    // If still not found, get default M2 merchant or first available M2
    const defaultM2Query = await db.collection('merchants')
      .where('userType', '==', 'merchant')
      .where('merchantType', '==', 'M2')
      .limit(1)
      .get();

    if (!defaultM2Query.empty) {
      const merchant = defaultM2Query.docs[0];
      return {
        merchantId: merchant.id,
        merchantName: merchant.data().fullName || merchant.data().name || 'M2 Merchant'
      };
    }

    // Fallback: return default M2_001 if no merchant found
    return {
      merchantId: 'M2_001',
      merchantName: 'Default M2 Merchant'
    };
  } catch (error) {
    console.error('Error finding M2 merchant:', error);
    // Return default on error
    return {
      merchantId: 'M2_001',
      merchantName: 'Default M2 Merchant'
    };
  }
};

// Send notification to merchant (placeholder - implement actual notification service)
const notifyMerchant = async (merchantId, ticketId, requestType, farmerName) => {
  try {
    // TODO: Implement actual notification (FCM, SMS, Email, etc.)
    console.log(`Notification sent to merchant ${merchantId}: New ${requestType} request from ${farmerName} (Ticket: ${ticketId})`);
    
    // Optionally create notification record
    await db.collection('notifications').add({
      merchantId,
      type: 'finance_request',
      title: `New ${requestType.toUpperCase()} Request`,
      message: `New ${requestType} request from ${farmerName}`,
      ticketId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't fail the request if notification fails
  }
};

// Create loan/KCC/finance request (Farmer only)
exports.createLoanRequest = async (req, res) => {
  try {
    const { userId, fullName, email, userType } = req.user;

    // Only farmers can create loan requests
    if (userType !== 'farmer') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only farmers can create loan requests'
      });
    }

    const { requestType } = req.body;

    // Validation - Only requestType is required
    const validRequestTypes = ['loan', 'kcc'];
    if (!requestType || !validRequestTypes.includes(requestType)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Request type is required',
        errors: {
          requestType: `Request type must be one of: ${validRequestTypes.join(', ')}`
        }
      });
    }

    // Get farmer details from database
    const farmerDoc = await db.collection('users').doc(userId).get();
    if (!farmerDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Farmer not found'
      });
    }

    const farmerData = farmerDoc.data();

    // Extract farmer details
    const farmerDetails = {
      farmerId: userId,
      farmerName: fullName || farmerData.fullName || 'Unknown',
      farmerPhone: farmerData.phoneNumber || '',
      farmerEmail: email || farmerData.email || '',
      pincode: farmerData.pincode || farmerData.pinCode || '',
      village: farmerData.village || '',
      bankAccount: farmerData.bankAccount || farmerData.accountNumber || '',
      ifscCode: farmerData.ifscCode || farmerData.ifsc || '',
      kisanCard: farmerData.kisanCard || farmerData.kisanCardNumber || ''
    };

    // Generate unique IDs
    const requestId = generateRequestId();
    const ticketId = generateTicketId();

    // Find and assign M2 merchant based on PIN/village
    const merchantAssignment = await findM2Merchant(farmerDetails.pincode, farmerDetails.village);

    // Create finance request record
    const financeRequestData = {
      requestId,
      ticketId,
      farmerId: farmerDetails.farmerId,
      farmerName: farmerDetails.farmerName,
      farmerPhone: farmerDetails.farmerPhone,
      farmerEmail: farmerDetails.farmerEmail,
      pincode: farmerDetails.pincode,
      village: farmerDetails.village,
      bankAccount: farmerDetails.bankAccount,
      ifscCode: farmerDetails.ifscCode,
      kisanCard: farmerDetails.kisanCard,
      requestType, // 'loan' or 'kcc'
      status: 'pending',
      merchantId: merchantAssignment.merchantId,
      merchantName: merchantAssignment.merchantName,
      // Amount, purpose, tenure will be discussed offline
      loanAmount: null,
      purpose: null,
      tenure: null,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create ticket record
    const ticketData = {
      ticketId,
      ticketType: 'finance_request',
      relatedId: requestId,
      relatedType: requestType, // 'loan' or 'kcc'
      status: 'open',
      assignedTo: merchantAssignment.merchantId,
      assignedToName: merchantAssignment.merchantName,
      createdBy: farmerDetails.farmerId,
      createdByName: farmerDetails.farmerName,
      farmerId: farmerDetails.farmerId,
      farmerName: farmerDetails.farmerName,
      priority: 'normal',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to database
    await db.collection('finance_requests').add(financeRequestData);
    await db.collection('tickets').add(ticketData);

    // Send notification to assigned merchant
    await notifyMerchant(
      merchantAssignment.merchantId,
      ticketId,
      requestType,
      farmerDetails.farmerName
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Finance request submitted successfully',
      data: {
        requestId,
        requestType,
        status: 'pending',
        ticketId,
        farmerId: farmerDetails.farmerId,
        merchantId: merchantAssignment.merchantId,
        submittedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create loan request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get all loan requests (Merchant/Admin see all, Farmer sees their own)
exports.getLoanRequests = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { requestType, status, farmerId } = req.query;

    let query = db.collection('finance_requests');

    // Farmers see only their own requests
    if (userType === 'farmer') {
      query = query.where('farmerId', '==', userId);
    }
    // Merchants see requests assigned to them
    else if (userType === 'merchant') {
      query = query.where('merchantId', '==', userId);
    }
    // Admin sees all requests
    else if (userType === 'admin') {
      // Optional: filter by farmerId if provided
      if (farmerId) {
        query = query.where('farmerId', '==', farmerId);
      }
    }

    const snap = await query.get();
    let requests = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by request type if provided
    if (requestType) {
      const validRequestTypes = ['loan', 'kcc'];
      if (validRequestTypes.includes(requestType)) {
        requests = requests.filter(req => req.requestType === requestType);
      }
    }

    // Filter by status if provided
    if (status) {
      const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'disbursed'];
      if (validStatuses.includes(status)) {
        requests = requests.filter(req => req.status === status);
      }
    }

    // Sort by submittedAt (newest first)
    requests.sort((a, b) => {
      const aTime = a.submittedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bTime = b.submittedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      success: true,
      message: 'Loan requests retrieved successfully',
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Get loan requests error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Get single loan request by ID
exports.getLoanRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, userType } = req.user;

    // Find by requestId field (not document ID)
    const requestQuery = await db.collection('finance_requests')
      .where('requestId', '==', requestId)
      .limit(1)
      .get();

    if (requestQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Loan request not found'
      });
    }

    const requestDoc = requestQuery.docs[0];
    const requestData = requestDoc.data();

    // Check access permissions
    if (userType === 'farmer' && requestData.farmerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this request'
      });
    }

    if (userType === 'merchant' && requestData.merchantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this request'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Loan request retrieved successfully',
      data: {
        id: requestDoc.id,
        ...requestData
      }
    });
  } catch (error) {
    console.error('Get loan request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};

// Update loan request status (Merchant/Admin only)
exports.updateLoanRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, fullName, userType } = req.user;
    const { status, loanAmount, purpose, tenure, reviewNotes } = req.body;

    // Only merchants and admins can update requests
    if (userType !== 'merchant' && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only merchants and admins can update loan requests'
      });
    }

    // Find request by requestId
    const requestQuery = await db.collection('finance_requests')
      .where('requestId', '==', requestId)
      .limit(1)
      .get();

    if (requestQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Loan request not found'
      });
    }

    const requestDoc = requestQuery.docs[0];
    const requestData = requestDoc.data();

    // Check if merchant owns this request
    if (userType === 'merchant' && requestData.merchantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this request'
      });
    }

    // Validate status
    if (status) {
      const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'disbursed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid status',
          errors: {
            status: `Status must be one of: ${validStatuses.join(', ')}`
          }
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status) {
      updateData.status = status;
      updateData.reviewedBy = userId;
      updateData.reviewedByName = fullName;
      updateData.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (loanAmount !== undefined) {
      updateData.loanAmount = Number(loanAmount);
    }

    if (purpose) {
      updateData.purpose = purpose;
    }

    if (tenure !== undefined) {
      updateData.tenure = Number(tenure);
    }

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }

    // Update finance request
    await db.collection('finance_requests').doc(requestDoc.id).update(updateData);

    // Update ticket status if status changed
    if (status) {
      const ticketQuery = await db.collection('tickets')
        .where('ticketId', '==', requestData.ticketId)
        .limit(1)
        .get();

      if (!ticketQuery.empty) {
        const ticketStatusMap = {
          'pending': 'open',
          'under_review': 'in_progress',
          'approved': 'resolved',
          'rejected': 'closed',
          'disbursed': 'resolved'
        };

        await db.collection('tickets').doc(ticketQuery.docs[0].id).update({
          status: ticketStatusMap[status] || 'in_progress',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Get updated request
    const updatedDoc = await db.collection('finance_requests').doc(requestDoc.id).get();

    return res.status(200).json({
      success: true,
      message: 'Loan request updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Update loan request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong on the server'
    });
  }
};
