const express = require('express');

const browseProblemsController = require('../controllers/browseProblems');

const router = express.Router();

router.post('/show', browseProblemsController.show);

router.post('/problems', browseProblemsController.getProblem);

router.post('/problems/:problemId', browseProblemsController.updateProblem);

router.post('/delete/:problemId', browseProblemsController.deleteProblem);

module.exports = router;