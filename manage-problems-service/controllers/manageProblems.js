const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

exports.problems = async (req, res) => {
    const sessionId = req.body.sessionId;

    try {
        // Extract problem data from the request body
        const problemData = req.body;

        // Validate the incoming problem data
        if (!problemData.problemType || !problemData.sessionId) {
            return res.status(400).json({ message: 'Problem type and sessionId are required' });
        }

            // Save the problem data in the database
            const newProblem = await models.Problem.create({
                problemType: problemData.problemType,
                sessionId: problemData.sessionId,
                problemDetails: problemData,  // Store the entire problem data as JSON
            });

            console.log('Problem saved in Manage Problem Service:', newProblem);

            // Start the problem execution by sending the problem data to the OR-Tools microservice
            const ortoolsUrl = 'http://ortools_service:4005/execute';  // Replace with the correct OR-Tools microservice URL

            console.log('Sending problem to OR-Tools microservice for execution...');

            try {
                const executionResponse = await axios.post(ortoolsUrl, {
                    problemType: problemData.problemType,
                    problemDetails: problemData,  // Include relevant problem details for OR-Tools
                    sessionId: sessionId
                });

                // Log OR-Tools response
                console.log('OR-Tools execution response:', executionResponse.data);

                // Handle the successful execution response, return execution ID to submit_problem_service
                const executionId = executionResponse.data.executionId;

                return res.status(200).json({
                    message: 'Problem saved and execution started successfully in OR-Tools.',
                    executionId: executionId,  // Return executionId for tracking
                    executionResult: executionResponse.data
                });
            } catch (execError) {
                console.error('Error starting execution in OR-Tools:', execError.message);
                return res.status(500).json({
                    message: 'Problem saved, but failed to start execution in OR-Tools.',
                    error: execError.message
                });
            }
    } catch (error) {
        console.error('Error saving problem in Manage Problem Service:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};



exports.getExecutionStatus = async (req, res) => {
    try {
        const { executionId } = req.params;
        // Fetch the specific execution details
        const execution = await Executions.findByPk(executionId, {
            include: [{
                model: Problems,
                as: 'problem' // Ensure that 'problem' is correctly set as an alias in your model association
            }]
        });
        if (!execution) {
            return res.status(404).json({ message: "Execution not found" });
        }
        res.json(execution);
    } catch (error) {
        console.error('Failed to retrieve execution status:', error);
        res.status(500).json({ message: 'Failed to retrieve execution status', error: error.message });
    }
};
