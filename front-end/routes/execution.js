const express = require('express');
const executionController = require('../controllers/execution');

const router = express.Router();

router.post('/:executionId', executionController.execution);

module.exports = router;