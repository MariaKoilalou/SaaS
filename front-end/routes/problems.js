const express = require('express');
const problemsController = require('../controllers/layout');

const router = express.Router();

router.get('/show_problems', problemsController.getProblems);

module.exports = router;