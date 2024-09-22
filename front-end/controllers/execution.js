const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);


// In-memory storage for execution updates
let executionUpdates = {}; // Store updates for each execution

// Controller to handle execution updates
exports.updateExecution = (req, res) => {
    const { executionId, status, progress, result, metaData } = req.body;

    if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required.' });
    }

    // Store the execution status updates in-memory
    executionUpdates[executionId] = {
        status,
        progress: progress || 0, // Default to 0 if not provided
        result: result || null,
        metaData: metaData || null,
        updatedAt: new Date()
    };

    console.log(`Execution ${executionId} status updated to: ${status}`);

    // Respond with a success message
    return res.status(200).json({ message: 'Execution status updated successfully.' });
};

// Controller to fetch the execution status (used by the frontend polling mechanism)
exports.getExecutionStatus = (req, res) => {
    const { executionId } = req.params;

    const executionData = executionUpdates[executionId];

    if (!executionData) {
        return res.status(404).json({ message: 'Execution not found.' });
    }

    // Return the execution status
    return res.status(200).json(executionData);
};
