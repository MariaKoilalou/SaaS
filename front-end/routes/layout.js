const express = require('express');
const layoutController = require('../controllers/layout');
const os = require('os');

const router = express.Router();

router.get('/', layoutController.getLanding);

router.get('/system/health', (req, res) => {
    const freeMemory = os.freemem() / (1024 * 1024);  // Free memory in MB
    const totalMemory = os.totalmem() / (1024 * 1024);  // Total memory in MB
    const loadAvg = os.loadavg()[0];  // 1-minute load average

    const healthStatus = `Memory: ${freeMemory.toFixed(2)} MB free / ${totalMemory.toFixed(2)} MB total, Load: ${loadAvg.toFixed(2)}`;

    res.json({ healthStatus });
});

module.exports = router;