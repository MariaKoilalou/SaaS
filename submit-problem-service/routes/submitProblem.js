const express = require('express');

const submitProblemController = require('../controllers/submitProblem');

const router = express.Router();

router.post('/submit', submitProblemController.submit);

router.get('/status', submitProblemController.status);

module.exports = router;