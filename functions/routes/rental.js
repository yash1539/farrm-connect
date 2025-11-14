const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rental');

// Get all rental equipment (with optional filters: ?category=tractor&isAvailable=true&location=Jabalpur&search=mahindra)
router.get('/', rentalController.getAllRentals);

// Get single rental equipment by ID
router.get('/:id', rentalController.getRental);

// Create new rental equipment
router.post('/', rentalController.createRental);

// Update rental equipment
router.patch('/:id', rentalController.updateRental);

// Delete rental equipment
router.delete('/:id', rentalController.deleteRental);

module.exports = router;

