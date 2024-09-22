const express = require('express');
const creditsController = require('../controllers/credits');

const router = express.Router();

router.post('/buy', creditsController.buy);

router.post('/update'. creditsController.update);
module.exports = router;
