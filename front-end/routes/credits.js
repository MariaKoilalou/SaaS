const express = require('express');
const creditsController = require('../controllers/credits');
const os = require("os");

const router = express.Router();

router.get('/system/health', (req, res) => {
    const freeMemory = os.freemem() / (1024 * 1024);  // Free memory in MB
    const totalMemory = os.totalmem() / (1024 * 1024);  // Total memory in MB
    const loadAvg = os.loadavg()[0];  // 1-minute load average

    const healthStatus = `Memory: ${freeMemory.toFixed(2)} MB free / ${totalMemory.toFixed(2)} MB total, Load: ${loadAvg.toFixed(2)}`;

    res.json({ healthStatus });
});

router.post('/buy', creditsController.buyCredits);

router.get('/', creditsController.layout);

module.exports = router;