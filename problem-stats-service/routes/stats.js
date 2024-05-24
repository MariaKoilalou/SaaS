const express = require('express');

const statsController = require('../controllers/stats');

const router = express.Router();

router.get('/stats', statsController.stats);

router.get('/status', statsController.status);

module.exports = router;
