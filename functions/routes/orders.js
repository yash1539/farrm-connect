const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create order (Farmer only)
router.post('/', ordersController.createOrder);

// Get orders (Farmer sees their own, Merchant sees all)
router.get('/', ordersController.getOrders);

// Get single order by ID
router.get('/:orderId', ordersController.getOrder);

// Update order (Payment by Farmer, Status by Merchant)
router.patch('/:orderId', ordersController.updateOrder);

// Cancel order (Farmer only)
router.delete('/:orderId', ordersController.cancelOrder);

module.exports = router;

