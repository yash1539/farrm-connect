const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment');

router.get('/', equipmentController.listEquipment);
router.post('/bookings', equipmentController.bookEquipment);
router.get('/bookings', equipmentController.listBookings);
router.patch('/bookings/:id', equipmentController.updateBooking);

module.exports = router;
