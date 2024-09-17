const express = require('express');
const manageProblemsController = require('../controllers/manageProblems');

const router = express.Router();

router.post('/problems', manageProblemsController.problems);

router.get('/executions/:executionId', manageProblemsController.getExecutionStatus);

module.exports = router;
