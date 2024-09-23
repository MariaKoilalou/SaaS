const axios = require('axios');
const sequelize = require('../utils/database');
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const { sendMessageToQueue } = require('../utils/rabbitmq/publisher');
const { consumeMessagesFromQueue } = require('../utils/rabbitmq/consumer'); // RabbitMQ consumer

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
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24-hour expiration
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
            inputData: {}
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
            executionId: newExecution.id // Pass executionId to OR-Tools
        });

    } catch (error) {
        console.error('Error in Manage Problem Service:', error.message);
        console.error('Full error:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to start the problem execution.' });
    }
};


// Function to update the execution metadata and input data
exports.updateExecution = async (req, res) => {
    const { executionId } = req.params;
    const { newMeta, newInput } = req.body;

    try {
        const execution = await models.Execution.findByPk(executionId);

        if (!execution) {
            return res.status(404).json({ message: 'Execution not found.' });
        }

        // Update metadata and input data if provided
        if (newMeta) {
            execution.metaData = {
                ...execution.metaData,
                ...newMeta
            };
        }
        if (newInput) {
            execution.inputData = {
                ...execution.inputData,
                ...newInput
            };
        }

        await execution.save();

        // Publish an update message to RabbitMQ
        const updateMessage = {
            action: 'execution_updated',
            executionId: execution.id,
            metaData: execution.metaData,
            inputData: execution.inputData,
            message: `Execution ${execution.id} has been updated.`
        };
        sendMessageToQueue(updateMessage);  // Notify RabbitMQ

        return res.status(200).json({
            message: 'Execution updated successfully',
            executionId: execution.id,
            metaData: execution.metaData,
            inputData: execution.inputData
        });

    } catch (error) {
        console.error('Error updating execution:', error.message);
        return res.status(500).json({ message: 'Internal server error. Unable to update execution.' });
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

        const execution = await models.Execution.findOne({ where: { problemId } });

        if (execution && execution.status === 'pending') {
            // Update the execution status to cancelled
            await execution.update({
                status: 'cancelled',
                result: 'Execution was cancelled by the user.'
            });

            // Publish a cancellation message to RabbitMQ
            const cancellationMessage = {
                action: 'execution_cancelled',
                executionId: execution.id,
                message: `Execution for problem ID ${problemId} has been cancelled.`
            };
            sendMessageToQueue(cancellationMessage);  // Notify RabbitMQ
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
