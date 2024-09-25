const express = require('express');

const browseProblemsController = require('../controllers/browseProblems');

const router = express.Router();

router.post('/show', browseProblemsController.show);

router.post('/problem', browseProblemsController.getProblem);

// router.post('/update/:problemId', browseProblemsController.updateProblem);

router.post('/delete/:problemId', browseProblemsController.deleteProblem);

router.post('/status', browseProblemsController.getStatus);

router.post('/stats', browseProblemsController.sendProblemsStats);

module.exports = router;