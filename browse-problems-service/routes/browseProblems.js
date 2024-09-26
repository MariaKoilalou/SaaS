const express = require('express');

const browseProblemsController = require('../controllers/browseProblems');

const router = express.Router();

router.post('/show', browseProblemsController.show);

router.post('/problem', browseProblemsController.getProblem);

router.post('/delete/:problemId', browseProblemsController.deleteProblem);

router.post('/stats', browseProblemsController.sendProblemsStats);

module.exports = router;