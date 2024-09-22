const express = require('express');
const creditsController = require('../controllers/credits');

const router = express.Router();

router.post('/buy', creditsController.buyCredits);

router.post('/update', creditsController.updateCredits);

router.get('/balance', creditsController.getBalance);

module.exports = router;
