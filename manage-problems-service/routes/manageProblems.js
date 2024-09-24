const express = require('express');
const manageProblemsController = require('../controllers/manageProblems');

const router = express.Router();

router.post('/problems', manageProblemsController.getProblem);

router.get('/executions/:executionId/status', manageProblemsController.getExecutionStatus);

router.post('/delete/:problemId', manageProblemsController.deleteProblem);

module.exports = router;
