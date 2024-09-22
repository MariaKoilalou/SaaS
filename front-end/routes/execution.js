const express = require('express');
const executionController = require('../controllers/execution');

const router = express.Router();

// Endpoint to receive execution updates from Manage Problem Service
router.post('/executions/update', executionController.updateExecution);

// Endpoint for the frontend to fetch the status of a specific execution
router.get('/executions/:executionId/status', executionController.getExecutionStatus);

module.exports = router;