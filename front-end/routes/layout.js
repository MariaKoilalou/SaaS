const express = require('express');
const layoutController = require('../controllers/layout');

const router = express.Router();

router.get('/', layoutController.getLanding);

// router.get('/show_problems', layoutController.getProblems);

// router.get('/submit_problem', layoutController.postProblem);
//
// router.get('/buy_credits', layoutController.getCredits);

module.exports = router;