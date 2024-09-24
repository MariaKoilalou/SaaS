const express = require('express');
const statsController = require('../controllers/stats');

const router = express.Router();

router.post('/problems', statsController.problems);

module.exports = router;
