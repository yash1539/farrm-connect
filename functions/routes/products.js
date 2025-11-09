const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');

// Get all products (with optional filters: ?category=seeds&inStock=true&search=wheat)
router.get('/', productsController.getAllProducts);

// Get single product by ID
router.get('/:id', productsController.getProduct);

// Create new product
router.post('/', productsController.createProduct);

// Update product
router.patch('/:id', productsController.updateProduct);

// Delete product
router.delete('/:id', productsController.deleteProduct);

module.exports = router;

