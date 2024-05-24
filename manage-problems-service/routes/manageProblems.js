const express = require('express');
const manageProblemsController = require('../controllers/manageProblems');

const router = express.Router();

router.get('/problems', manageProblemsController.showProblems);

router.get('/executions/:executionId', manageProblemsController.getExecutionStatus);

module.exports = router;
