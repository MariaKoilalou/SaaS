const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const io = require('../utils/socket'); // Assuming you have a socket setup

exports.getProblem = async (req, res) => {
    const newBalance = req.body.newBalance;
    const sessionId = req.body.sessionId;
    const url = 'http://browse_problems_service:4003/problems';

    console.log('getProblem: Received request for sessionId:', sessionId);

    try {
        // Check if the session exists in the Session table
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });

        // If the session does not exist, create a new one
        if (!sessionData) {
            console.log(`Session ${sessionId} not found, creating a new one.`);
            sessionData = await models.Session.create({
                sid: sessionId,
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24-hour expiration
                data: JSON.stringify({ balance: newBalance })
            });
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

        // **Respond immediately to Submit Problem Service**
        res.status(200).json({
            message: 'Execution started successfully',
            executionId: newExecution.id
        });

        // Notify the browse problem service about the new problem submission
        try {
            await axios.post(url, {
                problemId: newProblem.id,
                newBalance: req.body.newBalance,
                sessionId: newProblem.sessionId,
                status: 'pending',
                problemType: newProblem.problemType,
                details: newProblem.problemDetails
            });
            console.log('New problem notified to Browse Problem Service');
        } catch (error) {
            console.error('Failed to notify Browse Problem Service:', error.message);
        }

        // Inform clients that the execution has started
        io.getIO().emit('executionStart', {
            message: 'Execution started for problem ID: ' + newProblem.id,
            executionId: newExecution.id
        });

        // Start the problem execution by sending the problem data to the OR-Tools microservice
        const ortoolsUrl = 'http://ortools_service:4008/solver';  // OR-Tools microservice URL

        console.log('Sending problem to OR-Tools microservice for execution...');

        try {
            const executionResponse = await axios.post(ortoolsUrl, {
                problemType: problemData.problemType,
                problemDetails: problemData,
                sessionId: sessionId
            });

            // Update the execution entry in the database with the result
            await newExecution.update({
                status: 'completed',  // Update status to completed
                result: executionResponse.data || null  // Store the execution result
            });

            console.log('Execution completed for ID:', newExecution.id);

            // Notify browse problem service that execution is completed
            await axios.patch(`${url}`, {
                status: 'completed',
                result: executionResponse.data
            });

            console.log('Execution result updated in Browse Problem Service.');

        } catch (execError) {
            console.error('Error during OR-Tools execution:', execError.message);

            // Mark the execution as failed in the database
            await newExecution.update({
                status: 'failed',
                result: execError.message
            });

            // Notify the browse problem service that the execution failed
            await axios.patch(`${url}`, {
                status: 'failed',
                result: execError.message
            });

            console.log('Execution failure notified to Browse Problem Service.');
        }

    } catch (error) {
        console.error('Error in Manage Problem Service:', error.message);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};

