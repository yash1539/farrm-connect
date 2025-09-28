const express = require('express');
const router = express.Router();
const produceController = require('../controllers/produce');

router.post('/', produceController.createProduce);
router.get('/', produceController.listProduce);
router.get('/:id', produceController.getProduce);
router.patch('/:id', produceController.updateProduce);

module.exports = router;
