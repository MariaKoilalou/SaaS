const express = require('express');
const manageProblemsController = require('../controllers/manageProblems');

const router = express.Router();

router.post('/problems', manageProblemsController.getProblem);

router.get('/manage/:executionId/status', manageProblemController.getExecutionStatus);

module.exports = router;
