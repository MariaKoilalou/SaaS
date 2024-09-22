const axios = require('axios');
const sequelize = require('../utils/database');
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const { sendMessageToQueue } = require('../utils/rabbitmq/publisher');  // RabbitMQ Publisher

// Function to create a problem and start execution
exports.getProblem = async (req, res) => {
    const sessionId = req.body.sessionId;
    const problemType = req.body.problemType;
    const newBalance = req.body.newBalance;
    const problemDetails = req.body;

    const browseServiceUrl = 'http://browse_problems_service:4003';

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

        const newProblem = await models.Problem.create({
            problemType: problemType,
            sessionId: sessionId,
            problemDetails: problemDetails
        });

        const newExecution = await models.Execution.create({
            problemId: newProblem.id,
            status: 'pending',
            result: null
        });

        // Notify the browse service about the new problem
        await axios.post(browseServiceUrl, {
            problemId: newProblem.id,
            sessionId,
            status: 'pending',
            problemType,
            details: problemDetails
        });

        console.log('Execution created with ID:', newExecution.id);

        res.status(200).json({
            message: 'Problem created and execution started.',
            executionId: newExecution.id
        });

        // Publish an initial message to RabbitMQ for the browse service and frontend
        const message = {
            action: 'execution_started',
            executionId: newExecution.id,
            problemId: newProblem.id,
            sessionId: sessionId,
            status: 'pending',
            problemType: problemType,
            details: problemDetails
        };
        sendMessageToQueue(message); // Publish message to RabbitMQ

        // Start execution and send updates
        await startExecutionAndSendUpdates(newProblem, newExecution, browseServiceUrl);

    } catch (error) {
        console.error('Error in Manage Problem Service:', error.message);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};

async function startExecutionAndSendUpdates(problem, execution, browseServiceUrl) {
    const ortoolsUrl = `http://ortools_service:4008/solver`;

    try {
        // Send problem details to OR-Tools service to start execution
        const ortoolsResponse = await axios.post(ortoolsUrl, {
            problemType: problem.problemType,
            problemDetails: problem.problemDetails,
            sessionId: problem.sessionId,
            executionId: execution.id
        });

        if (ortoolsResponse.data && ortoolsResponse.data.executionId) {
            console.log(`Execution started for ID ${execution.id} in OR-Tools.`);
        } else {
            throw new Error('Failed to start execution in OR-Tools.');
        }

        // Notify RabbitMQ about the execution start
        const message = {
            action: 'execution_started',
            executionId: execution.id,
            problemId: problem.id,
            sessionId: problem.sessionId,
            status: 'in-progress',
            message: `Execution started for problem ID: ${problem.id}`
        };
        sendMessageToQueue(message);  // Publish the message

        await pollExecutionStatusAndSendUpdates(execution, browseServiceUrl);

    } catch (execError) {
        console.error('Error starting execution in OR-Tools:', execError.message);

        await execution.update({ status: 'failed', result: execError.message });
        await axios.patch(`${browseServiceUrl}/${problem.id}`, {
            status: 'failed',
            result: execError.message
        });

        // Notify RabbitMQ about execution failure
        const failureMessage = {
            action: 'execution_failed',
            executionId: execution.id,
            problemId: problem.id,
            message: `Execution failed for problem ID: ${problem.id}`,
            error: execError.message
        };
        sendMessageToQueue(failureMessage);
    }
}

async function pollExecutionStatusAndSendUpdates(execution, browseServiceUrl) {
    const ortoolsStatusUrl = `http://ortools_service:4008/status/${execution.id}`;
    let pollInterval = 5000; // Poll every 5 seconds

    const poll = setInterval(async () => {
        try {
            const response = await axios.get(ortoolsStatusUrl);
            const { status, result, progress, metaData } = response.data;

            // Update the execution status, result, and progress in the database
            await execution.update({
                status,
                result: result || null,
                progress: progress || execution.progress,
                metaData: metaData || execution.metaData
            });

            // Notify the browse service about the execution status update
            await axios.patch(`${browseServiceUrl}/${execution.problemId}`, {
                status,
                result,
                progress,
                metaData
            });

            // Send a message to RabbitMQ with the status update
            const updateMessage = {
                action: 'execution_status_updated',
                executionId: execution.id,
                problemId: execution.problemId,
                status,
                progress,
                metaData,
                message: `Execution status updated for problem ID: ${execution.problemId}`
            };
            sendMessageToQueue(updateMessage);  // Publish the update to RabbitMQ

            // Stop polling if execution is completed or failed
            if (status === 'completed' || status === 'failed') {
                clearInterval(poll);
                console.log(`Execution ${execution.id} ${status}. Polling stopped.`);
            }

        } catch (pollError) {
            console.error('Error polling OR-Tools Service:', pollError.message);
        }
    }, pollInterval);
}
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
