const express = require('express');
const router = express.Router();
const wasteController = require('../controllers/waste');

router.post('/', wasteController.createWastePickup);
router.get('/', wasteController.listWastePickups);
router.patch('/:id', wasteController.updateWastePickup);

module.exports = router;
