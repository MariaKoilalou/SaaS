const express = require('express');

const browseProblemsController = require('../controllers/browseProblems');

const router = express.Router();

router.post('/show', browseProblemsController.show);

router.post('/problems', browseProblemsController.getProblem);

router.post('/update/:problemId', browseProblemsController.updateProblem);

router.post('/delete/:problemId', browseProblemsController.deleteProblem);

router.get('/status', browseProblemsController.getStatus);

module.exports = router;