const express = require('express');
const router = express.Router();
const reelsController = require('../controllers/reels');

router.get('/', reelsController.listReels);
router.post('/', reelsController.uploadReel);

module.exports = router;
