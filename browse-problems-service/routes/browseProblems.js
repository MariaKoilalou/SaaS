const express = require('express');

const browseProblemsController = require('../controllers/browseProblems');

const router = express.Router();

router.post('/show', browseProblemsController.show);

router.post('/problems', browseProblemsController.getProblem);

module.exports = router;