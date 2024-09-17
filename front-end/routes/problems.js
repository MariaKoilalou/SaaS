const express = require('express');
const problemsController = require('../controllers/problems');

const router = express.Router();

router.get('/', problemsController.renderSubmitProblemForm);

router.post('/submit', problemsController.handleSubmitProblem);

router.get('/show', problemsController.browseProblems);

module.exports = router;