const express = require('express');
const creditsController = require('../controllers/credits');

const router = express.Router();

router.get('/buy', creditsController.buyCredits);

module.exports = router;