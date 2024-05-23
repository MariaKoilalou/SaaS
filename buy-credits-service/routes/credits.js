const express = require('express');

const creditsController = require('../controllers/credits');

const router = express.Router();

router.post('/buy', creditsController.buyCredits);

router.get('/show', creditsController.totalCredits);

router.get('/status', creditsController.status);

module.exports = router;