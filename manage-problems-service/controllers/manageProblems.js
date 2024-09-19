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

        // Create an execution entry in the database with a "pending" status before starting execution
        const newExecution = await models.Execution.create({
            problemId: newProblem.id,  // Link the execution to the problem
            status: 'pending',  // Set initial status to pending
            result: null  // No result yet, it will be updated after execution
        });

        console.log('Execution created with ID:', newExecution.id);

        // Start the problem execution by sending the problem data to the OR-Tools microservice
        const ortoolsUrl = 'http://ortools_service:4008/solver';  // OR-Tools microservice URL

        console.log('Sending problem to OR-Tools microservice for execution...');

        try {
            const executionResponse = await axios.post(ortoolsUrl, {
                problemType: problemData.problemType,
                problemDetails: problemData,  // Include relevant problem details for OR-Tools
                sessionId: sessionId
            });

            // Log OR-Tools response
            console.log('OR-Tools execution response:', executionResponse.data);

            // Update the execution entry in the database with the result
            await newExecution.update({
                status: 'completed',  // Update status to completed
                result: executionResponse.data.executionResult || null  // Store the execution result
            });

            console.log('Execution updated with result for ID:', newExecution.id);

            // Return executionId and success response
            return res.status(200).json({
                message: 'Problem saved and execution started successfully in OR-Tools.',
                executionId: newExecution.id,  // Return the generated executionId
                executionResult: executionResponse.data
            });
        } catch (execError) {
            console.error('Error starting execution in OR-Tools:', execError.message);

            // Update the execution entry in the database to "failed"
            await newExecution.update({
                status: 'failed',  // Mark the execution as failed
                result: execError.message  // Store the error message
            });

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


// Retrieve execution status by execution ID
exports.getExecutionStatus = async (req, res) => {
    try {
        const { executionId } = req.params;

        // Fetch the execution details from the database
        const execution = await models.Execution.findByPk(executionId, {
            include: [{
                model: models.Problem, // Make sure the association is correctly defined
                as: 'problem'  // Ensure that 'problem' is set as an alias in your model association
            }]
        });

        if (!execution) {
            return res.status(404).json({ message: "Execution not found" });
        }

        return res.json(execution);
    } catch (error) {
        console.error('Failed to retrieve execution status:', error);
        return res.status(500).json({ message: 'Failed to retrieve execution status', error: error.message });
    }
};

