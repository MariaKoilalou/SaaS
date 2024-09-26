const express = require('express');
const problemsController = require('../controllers/problems');
const os = require("os");

const router = express.Router();

router.get('/system/health', (req, res) => {
    const freeMemory = os.freemem() / (1024 * 1024);  // Free memory in MB
    const totalMemory = os.totalmem() / (1024 * 1024);  // Total memory in MB
    const loadAvg = os.loadavg()[0];  // 1-minute load average

    const healthStatus = `Memory: ${freeMemory.toFixed(2)} MB free / ${totalMemory.toFixed(2)} MB total, Load: ${loadAvg.toFixed(2)}`;

    res.json({ healthStatus });
});

router.get('/', problemsController.renderSubmitProblemForm);

router.post('/submit', problemsController.handleSubmitProblem);

router.get('/show', problemsController.browseProblems);

router.get('/status', problemsController.getProblemStatus);

router.get('/stats', problemsController.getStats);

router.get('/update/manage/:executionId', problemsController.showManageProblem);

router.post('/update/:executionId', problemsController.updateExecution);

router.get('/delete/:problemId', problemsController.deleteProblem);

router.get('/edit/:executionId', problemsController.renderEditExecutionPage);


module.exports = router;


module.exports = router;