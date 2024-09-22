const axios = require('axios');
const sequelize = require('../utils/database');
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const io = require('../utils/socket'); // Assuming you have a socket setup

// Function to create a problem and start execution
exports.getProblem = async (req, res) => {
    const sessionId = req.body.sessionId;
    const newBalance = req.body.newBalance;

    const browseServiceUrl = 'http://browse_problems_service:4003/problems';

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
            problemType: req.body.problemType,
            sessionId: sessionId,
            problemDetails: req.body
        });

        const newExecution = await models.Execution.create({
            problemId: newProblem.id,
            status: 'pending',
            result: null
        });

        await axios.post(browseServiceUrl, {
            problemId: newProblem.id,
            sessionId: newProblem.sessionId,
            status: 'pending',
            problemType: newProblem.problemType,
            details: newProblem.problemDetails
        });

        console.log('Execution created with ID:', newExecution.id);

        res.status(200).json({
            message: 'Problem created and execution started.',
            executionId: newExecution.id
        });

        await startExecutionAndPoll(newProblem, newExecution, browseServiceUrl);


    } catch (error) {
        console.error('Error in Manage Problem Service:', error.message);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};

// Helper function to start execution in OR-Tools Service and poll for status updates
async function startExecutionAndPoll(problem, execution, browseServiceUrl) {
    const ortoolsUrl = `http://ortools_service:4008/solver`;

    try {
        // Step 1: Start execution by sending problem details to OR-Tools Service
        const ortoolsResponse = await axios.post(ortoolsUrl, {
            problemType: problem.problemType,
            problemDetails: problem.problemDetails,
            sessionId: problem.sessionId,
            executionId: execution.id
        });

        // Confirm that execution has started
        if (ortoolsResponse.data && ortoolsResponse.data.executionId) {
            console.log(`Execution started for ID ${execution.id} in OR-Tools.`);
        } else {
            throw new Error('Failed to start execution in OR-Tools.');
        }

        await pollExecutionStatus(execution, browseServiceUrl);

    } catch (execError) {
        console.error('Error starting execution in OR-Tools:', execError.message);

        // Step 3: Mark the execution as failed and notify Browse Problem Service
        await execution.update({ status: 'failed', result: execError.message });

        await axios.patch(`${browseServiceUrl}/${problem.id}`, {
            status: 'failed',
            result: execError.message
        });

        // Notify the frontend about the failure
        io.getIO().emit('executionFailed', {
            message: `Execution failed for problem ID: ${problem.id}`,
            executionId: execution.id,
            error: execError.message
        });
    }
}

// Poll OR-Tools service for execution status updates
async function pollExecutionStatus(execution, browseServiceUrl) {
    const ortoolsStatusUrl = `http://ortools_service:4008/status/${execution.id}`;
    let pollInterval = 5000; // Poll every 5 seconds

    // Polling loop
    const poll = setInterval(async () => {
        try {
            // Step 1: Fetch the current status from OR-Tools
            const response = await axios.get(ortoolsStatusUrl);
            const status = response.data.status;
            const result = response.data.result || null;

            // Step 2: Update the status in Manage Problem Service
            await execution.update({
                status: status,
                result: result
            });

            // Step 3: Notify the Browse Problem Service about the status update
            await axios.patch(`${browseServiceUrl}/${execution.problemId}`, {
                status: status,
                result: result
            });

            // Emit WebSocket message to notify frontend of the status update
            io.getIO().emit('executionStatusUpdate', {
                message: `Execution updated for problem ID: ${execution.problemId}`,
                executionId: execution.id,
                status: status
            });

            // Step 4: Stop polling if execution is completed or failed
            if (status === 'completed' || status === 'failed') {
                clearInterval(poll);
                console.log(`Execution ${execution.id} ${status}. Polling stopped.`);
            }

        } catch (pollError) {
            console.error('Error polling OR-Tools Service:', pollError.message);
            // You may want to stop polling after too many errors
        }
    }, pollInterval);
}



exports.getExecutionStatus = async (req, res) => {
    const executionId = req.params.executionId;

    try {
        // Fetch execution details from the database
        const execution = await models.Execution.findByPk(executionId);

        if (!execution) {
            return res.status(404).json({ message: 'Execution not found' });
        }

        res.json({
            status: execution.status,
            result: execution.result
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching execution status', error: error.message });
    }
};

exports.deleteProblem = async (req, res) => {
    const problemId = req.params.problemId;
    console.log(`Received request to cancel and delete problem with ID: ${problemId}`);

    try {
        const problem = await models.Problem.findByPk(problemId);

        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        const execution = await models.Execution.findOne({ where: { problemId: problemId } });

        if (execution && execution.status === 'pending') {
            console.log(`Cancelling execution for problem ${problemId}.`);

            io.getIO().emit('executionCancelled', {
                message: `Execution for problem ID ${problemId} has been cancelled.`,
                executionId: execution.id
            });

            await execution.update({
                status: 'cancelled',
                result: 'Execution was cancelled by the user.'
            });

            console.log(`Execution for problem ${problemId} cancelled.`);
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

