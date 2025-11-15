const express = require('express');
const router = express.Router();
const loanRequestController = require('../controllers/loanRequest');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create loan/KCC/finance request (Farmer only)
router.post('/', loanRequestController.createLoanRequest);

// Get all loan requests (Farmer sees their own, Merchant/Admin see all)
router.get('/', loanRequestController.getLoanRequests);

// Get single loan request by ID
router.get('/:requestId', loanRequestController.getLoanRequest);

// Update loan request status (Merchant/Admin only)
router.patch('/:requestId', loanRequestController.updateLoanRequest);

module.exports = router;

