const express = require('express');
const creditsController = require('../controllers/credits');

const router = express.Router();

// Define the POST route for buying credits
router.post('/buy', creditsController.buy);

module.exports = router;
