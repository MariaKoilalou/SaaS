const express = require('express');
const problemsController = require('../controllers/problems');

const router = express.Router();

router.get('/', problemsController.renderSubmitProblemForm);

router.post('/submit', problemsController.handleSubmitProblem);

router.get('/show', problemsController.browseProblems);

router.get('/status', problemsController.getProblemStatus);

router.get('/manage/:problemId', problemsController.showManageProblem);

router.get('/delete/:problemId', problemsController.deleteProblem);

module.exports = router;