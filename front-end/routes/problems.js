const express = require('express');
const problemsController = require('../controllers/problems');

const router = express.Router();

router.post('/submit', problemsController.submitProblem);

router.get('/show', problemsController.browseProblems);

module.exports = router;