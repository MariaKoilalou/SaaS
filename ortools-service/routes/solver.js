const express = require('express');

const solverController = require('../controllers/solver');

const router = express.Router();

router.post('/solver', solverController.solver);

module.exports = router;