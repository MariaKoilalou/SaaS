const express = require('express');
const creditsController = require('../controllers/credits');

const router = express.Router();

router.post('/buy', creditsController.buyCredits);

router.get('/', creditsController.layout);

module.exports = router;