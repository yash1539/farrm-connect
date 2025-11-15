const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create payment (initiate payment)
router.post('/', paymentController.createPayment);

// Verify payment (callback from gateway)
router.post('/verify', paymentController.verifyPayment);

// Get payment status
router.get('/:paymentId', paymentController.getPaymentStatus);

// Get payments by order
router.get('/order/:orderId', paymentController.getPaymentsByOrder);

// Refund payment (merchant only)
router.post('/:paymentId/refund', paymentController.refundPayment);

module.exports = router;

