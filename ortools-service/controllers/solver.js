const { sendMessageToQueue } = require("../utils/rabbitmq/publisher");
const { spawn } = require('child_process');
const { resolve } = require("path");

exports.solver = async (req, res) => {
    try {
        const { problemType, problemDetails, sessionId, executionId } = req.body;

        // Validate incoming data
        if (!problemType || !problemDetails || problemType !== 'vrp') {
            return res.status(400).json({ message: 'Invalid or missing problem type or problem details.' });
        }

        console.log('Received VRP problem for OR-Tools:', problemDetails);

        // Extract metadata and input data from problemDetails
        const { locationFile, numVehicles, depot, maxDistance } = problemDetails;

        if (!locationFile || !numVehicles || depot === undefined || !maxDistance) {
            return res.status(400).json({ message: 'Missing required VRP parameters.' });
        }

        // Immediately send response to manage_problems_service to acknowledge problem start
        res.status(200).json({
            message: 'Solver execution started',
            executionId
        });

        // Send initial metadata and execution info to the queue
        sendMessageToQueue({
            action: 'solver_started',
            sessionId,
            problemType,
            meta: { numVehicles, depot, maxDistance },  // Sending metadata here
            status: "started",
            message: 'Solver execution has started',
            progress: 0
        }, `execution_updates_${executionId}`);

        // Execute solver in the background
        const scriptPath = resolve(__dirname, 'vrpSolver.py');
        const solverProcess = spawn('python3', [scriptPath, locationFile, numVehicles, depot, maxDistance]);

        // Process real-time output from the solver
        solverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('VRP Solver Output:', output);

            try {
                const progressUpdate = JSON.parse(output);
                const progress = progressUpdate.progress || 0;

                // Check if the message contains the final result
                const result = progressUpdate.result || null;

                // Send progress or final result update via RabbitMQ
                sendMessageToQueue({
                    action: result ? 'solver_completed' : 'solver_progress',  // Set action based on result
                    sessionId,
                    problemType,
                    progress,
                    status: result ? "completed" : "in-progress",
                    result,  // Include the final result when available
                    metaData: progressUpdate.metaData || null,  // Include metadata if available
                    message: result ? 'Solver execution completed' : 'Solver progress update'
                }, `execution_updates_${executionId}`);

            } catch (parseError) {
                console.log('Non-JSON output received, sending raw output.');
                sendMessageToQueue({
                    action: 'solver_progress_raw',
                    sessionId,
                    problemType,
                    status: "raw",
                    rawOutput: output,
                    message: 'Solver raw output received'
                }, `execution_updates_${executionId}`);
            }
        });

        // Handle solver completion
        solverProcess.on('close', (code) => {
            if (code === 0) {
                sendMessageToQueue({
                    action: 'solver_completed',
                    sessionId,
                    problemType,
                    status: "completed",
                    message: 'Solver execution completed successfully',
                    progress: 100
                }, `execution_updates_${executionId}`);
            } else {
                sendMessageToQueue({
                    action: 'solver_failed',
                    sessionId,
                    problemType,
                    status: "failed",
                    message: 'Solver process failed',
                    error: `Solver process exited with non-zero code: ${code}`
                }, `execution_updates_${executionId}`);
            }
        });

        // Handle solver errors
        solverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.error('Error in VRP Solver:', error);
            sendMessageToQueue({
                action: 'solver_error',
                sessionId,
                problemType,
                message: 'Solver encountered an error',
                error
            }, `execution_updates_${executionId}`);
        });

    } catch (error) {
        console.error('Error in OR-Tools Solver:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to solve the problem.',
            error: error.message
        });
    }
};
