const express = require('express');

const statsController = require('../controllers/stats');

const router = express.Router();

router.get('/stats', statsController.stats);

router.post('/problems', statsController.problems);

module.exports = router;
