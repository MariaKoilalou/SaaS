const axios = require('axios');
const sequelize = require('../utils/database');
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const { sendExecutionUpdateToQueue } = require('../utils/rabbitmq/publisher');
const { consumeMessagesFromQueue } = require('../utils/rabbitmq/consumer');  // RabbitMQ consumer

exports.editExecution = async (req, res) => {
    const { executionId, newExecutionData } = req.body;  // Assuming `executionId` and `newExecutionData` are passed in the body

    try {
        // Step 1: Delete the previous execution with the same executionId
        const deletedExecution = await models.Execution.destroy({
            where: { id: executionId }
        });

        if (!deletedExecution) {
            return res.status(404).json({ message: 'Execution not found for the given ID' });
        }

        const newExecution = await models.Execution.create({
            id: executionId,
            ...newExecutionData
        });

        // Step 3: Return the newly created execution
        res.status(201).json({
            message: 'Execution successfully edited',
            data: newExecution
        });

    } catch (error) {
        console.error('Error editing execution:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Controller to get execution details by executionId
exports.getExecution = async (req, res) => {
    const { executionId } = req.params;

    try {
        // Find execution by executionId in the database
        const execution = await models.Execution.findOne({
            where: { id: executionId }
        });

        if (!execution) {
            return res.status(404).json({ message: 'Execution not found' });
        }

        res.status(200).json(execution);
    } catch (error) {
        console.error('Error fetching execution details:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


exports.getExecutionDetails = async (req, res) => {
    const { problemIds } = req.body; // Array of integers

    try {
        // Fetch executions by problemIds
        const executions = await models.Execution.findAll({
            where: {
                problemId: problemIds
            }
        });

        if (!Array.isArray(executions)) {
            return res.status(500).json({ message: 'Executions data is not an array' });
        }

        res.status(200).json(executions);
    } catch (error) {
        console.error('Error fetching executions:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


// Function to receive and start execution
exports.getProblem = async (req, res) => {
    const sessionId = req.body.sessionId;
    const newBalance = req.body.newBalance;
    const problemType = req.body.problemType;
    const problemDetails = req.body;

    try {
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });

        if (!sessionData) {
            console.log(`Session ${sessionId} not found, creating a new one.`);
            sessionData = await models.Session.create({
                sid: sessionId,
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000),
                data: JSON.stringify({ balance: newBalance })
            });
        }

        // Create new problem and execution entry
        const newProblem = await models.Problem.create({
            problemType,
            sessionId,
            problemDetails
        });

        const newExecution = await models.Execution.create({
            problemId: newProblem.id,
            status: 'pending',
            result: null,
            metaData: {},
            inputData: {},
            startTime: new Date() // Set the start time when the execution is created
        });

        console.log('Execution created with ID:', newExecution.id);

        res.status(200).json({
            message: 'Problem created and execution started.',
            executionId: newExecution.id
        });

        const browseProblemsUrl = 'http://browse_problems_service:4003/problem';
        await axios.post(browseProblemsUrl, {
            sessionId,
            problemType,
            problemDetails
        });

        // Start OR-Tools execution in the background
        const ortoolsUrl = 'http://ortools_service:4008/solver';
        await axios.post(ortoolsUrl, {
            sessionId,
            problemType,
            problemDetails,
            executionId: newExecution.id  // Pass executionId to OR-Tools
        });
        console.log('Execution created with ID:', newExecution.id);

        // Start consuming messages from RabbitMQ queue related to this execution
        consumeMessagesFromQueue(newExecution.id);

        // Send a message to the RabbitMQ queue after the execution is created
        const executionUpdate = {
            action: 'execution_started',
            executionId: newExecution.id,
            sessionId,
            status: 'pending',
            progress: 0,
            message: 'Execution has started.'
        };

        // Publish the message to RabbitMQ
        sendExecutionUpdateToQueue('frontend_updates_queue', executionUpdate);

    } catch (error) {
        console.error('Error in Manage Problem Service:', error.message);
        return res.status(500).json({ message: 'Internal server error. Unable to start the problem execution.' });
    }
};


// Function to fetch the current status of an execution
exports.getExecutionStatus = async (req, res) => {
    const { executionId } = req.params;

    try {
        const execution = await models.Execution.findByPk(executionId);

        if (!execution) {
            return res.status(404).json({ message: 'Execution not found' });
        }

        res.json({
            status: execution.status,
            progress: execution.progress,
            result: execution.result,
            metaData: execution.metaData
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching execution status', error: error.message });
    }
};


// Function to delete a problem and cancel the related execution
exports.deleteProblem = async (req, res) => {
    const { problemId } = req.params;

    try {
        const problem = await models.Problem.findByPk(problemId);

        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        await problem.destroy();

        return res.status(200).json({
            message: `Problem ${problemId} and its execution have been deleted successfully.`
        });

    } catch (error) {
        console.error(`Error deleting problem ${problemId}:`, error.message);
        return res.status(500).json({ message: `Error deleting problem: ${error.message}` });
    }
};
