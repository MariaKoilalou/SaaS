const axios = require('axios');
const sequelize = require('../utils/database');
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Render the execution page
exports.execution = (req, res) => {
    const executionId = req.params.executionId;

    res.render('manageProblem.ejs', {
        executionId,
        sessionBalance: req.session.balance || 0
    });
};

// API endpoint to get the current status of an execution
exports.getExecutionStatus = async (req, res) => {
    const executionId = req.params.executionId;

    try {
        const response = await axios.get(`http://manage_problem_service:4004/executions/${executionId}/status`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching execution status:', error);
        res.status(500).json({ message: 'Error fetching execution status' });
    }
};
