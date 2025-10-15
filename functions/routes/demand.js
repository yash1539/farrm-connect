const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demand');

router.post('/', demandController.createDemand);
router.get('/', demandController.listDemands);
router.patch('/:id', demandController.updateDemand);

module.exports = router;
