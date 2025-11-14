const express = require('express');
const router = express.Router();
const sellController = require('../controllers/sell');
const { authenticate } = require('../middleware/auth');
const { validateSellProduct } = require('../middleware/validation');

// Get all sell products (public - no auth required)
router.get('/', sellController.getAllSellProducts);

// Get single sell product (public - no auth required)
router.get('/:productId', sellController.getSellProduct);

// Create product listing (requires authentication)
router.post('/', authenticate, validateSellProduct, sellController.createSellProduct);

// Update product listing (requires authentication)
router.patch('/:productId', authenticate, sellController.updateSellProduct);

// Delete product listing (requires authentication)
router.delete('/:productId', authenticate, sellController.deleteSellProduct);

module.exports = router;

