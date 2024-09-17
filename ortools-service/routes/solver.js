const express = require('express');

const solverController = require('../controllers/solver');

const router = express.Router();

router.post('/solve', solverController.solve);

module.exports = router;