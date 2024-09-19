const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const io = require('../utils/socket'); // Assuming you have a socket setup

exports.getProblem = async (req, res) => {
    const sessionId = req.body.sessionId;

    console.log('getProblem: Received request for sessionId:', sessionId);

    try {
        // Override session ID with the provided one
        req.sessionID = sessionId;

        // Retrieve session data using the session ID
        req.sessionStore.get(sessionId, async (err, sessionData) => {
            if (err) {
                console.error('Error fetching session:', err);
                return res.status(500).json({ message: 'Failed to retrieve session.' });
            }

            if (!sessionData) {
                console.log('Session not found for sessionId:', sessionId);
                return res.status(400).json({ message: 'Invalid session.' });
            }

            // Extract problem data from the request body
            const problemData = req.body;

            // Validate the incoming problem data
            if (!problemData.problemType || !problemData.sessionId) {
                return res.status(400).json({ message: 'Problem type and sessionId are required' });
            }

            // Save the problem data in the database
            const newProblem = await models.Problem.create({
                problemType: problemData.problemType,
                sessionId: req.body.sessionId,
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

            // Inform the client that execution has started
            io.getIO().emit('executionStart', {
                message: 'Execution started for problem ID: ' + newProblem.id,
                executionId: newExecution.id
            });

            // Start the problem execution by sending the problem data to the OR-Tools microservice
            const ortoolsUrl = 'http://ortools_service:4008/solver';  // OR-Tools microservice URL

            console.log('Sending problem to OR-Tools microservice for execution...');

            // Use a streaming response from OR-Tools for real-time updates
            try {
                const executionResponse = await axios({
                    method: 'post',
                    url: ortoolsUrl,
                    data: {
                        problemType: problemData.problemType,
                        problemDetails: problemData,  // Include relevant problem details for OR-Tools
                        sessionId: sessionId
                    },
                    responseType: 'stream' // Stream the OR-Tools response
                });

                executionResponse.data.on('data', async (chunk) => {
                    const update = JSON.parse(chunk.toString());

                    // Emit real-time update to the client via WebSocket
                    io.getIO().emit('executionUpdate', {
                        executionId: newExecution.id,
                        status: update.status || 'in-progress',
                        progress: update.progress || 0, // Progress percentage
                        partialResult: update.partialResult || null // If there are partial results
                    });

                    // Optionally, you can update the execution record in the database with the progress
                    await newExecution.update({
                        status: update.status || 'in-progress',
                        result: update.partialResult || null
                    });
                });

                // When OR-Tools finishes the execution
                executionResponse.data.on('end', async () => {
                    console.log('OR-Tools execution completed.');

                    // Update the execution entry in the database with the final result
                    await newExecution.update({
                        status: 'completed',  // Update status to completed
                        result: 'Final result from OR-Tools' // Example final result
                    });

                    io.getIO().emit('executionComplete', {
                        executionId: newExecution.id,
                        message: 'Execution completed successfully for ID: ' + newExecution.id
                    });

                    return res.status(200).json({
                        message: 'Problem saved and execution started successfully with real-time updates.',
                        executionId: newExecution.id
                    });
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
        });
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

