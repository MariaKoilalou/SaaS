const express = require('express');

const submitProblemController = require('../controllers/submitProblem');

const router = express.Router();

router.post('/submit', submitProblemController);

router.get('/status', submitProblemController);

module.exports = router;