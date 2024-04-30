const express = require('express');
const layoutController = require('../controllers/layout');

const router = express.Router();

// router.get('/', layoutController.getLanding);

router.get('/home', layoutController.getHome);

router.get('/about', layoutController.getAbout);

router.get('/demo', layoutController.getDemo);

router.get('/instructions', layoutController.getInstructions);

module.exports = router;