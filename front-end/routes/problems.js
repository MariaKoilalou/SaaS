const express = require('express');
const problemsController = require('../controllers/problems');

const router = express.Router();

const router = express.Router();

router.post('/submit', problemsController.submitProblem);

router.get('/show', problemsController.browseProblems);

router.get('/:id', problemsController.showProblem);

router.post('/results/:id', problemsController.resultsProblem);

module.exports = router;