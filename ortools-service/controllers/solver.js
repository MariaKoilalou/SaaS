const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { sendMessageToQueue } = require('../utils/rabbitmq/publisher'); // Import RabbitMQ publisher

// Solver function to process the problem
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

        // Ensure required metadata and input data are present
        if (!locationFile || !numVehicles || depot === undefined || !maxDistance) {
            return res.status(400).json({ message: 'Missing required VRP parameters.' });
        }

        // Metadata: numVehicles, depot, maxDistance
        const meta = { numVehicles, depot, maxDistance };

        // Input Data: locationFile
        const input = {
            locationFilePath: path.resolve(__dirname, locationFile)
        };

        if (!fs.existsSync(input.locationFilePath)) {
            return res.status(400).json({ message: 'Location file not found.' });
        }

        // Log metadata and input data for debugging
        console.log('Meta Data:', meta);
        console.log('Input Data:', input);

        // Publish an event that the solver has started to RabbitMQ, using the queue for the execution
        sendMessageToQueue({
            action: 'solver_started',
            sessionId,
            problemType,
            meta,
            message: 'Solver execution has started',
            progress: 0
        }, `execution_updates_${executionId}`);

        // Construct the command to run the Python script using spawn
        const scriptPath = path.resolve(__dirname, 'vrpSolver.py');
        const solverProcess = spawn('python3', [scriptPath, input.locationFilePath, meta.numVehicles, meta.depot, meta.maxDistance]);

        // Send initial progress update to the client
        res.write(JSON.stringify({ status: 'started', progress: 0 }) + '\n');

        // Capture real-time output from the Python script
        solverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('VRP Solver Output:', output);

            try {
                const progressUpdate = JSON.parse(output);
                const progress = progressUpdate.progress || null;

                // Send partial results/progress to the client
                res.write(JSON.stringify({
                    status: 'in-progress',
                    progress,
                    partialResult: progressUpdate.partialResult || null
                }) + '\n');

                // Publish progress update to RabbitMQ
                sendMessageToQueue({
                    action: 'solver_progress',
                    sessionId,
                    problemType,
                    progress,
                    partialResult: progressUpdate.partialResult || null,
                    message: 'Solver progress update'
                }, `execution_updates_${executionId}`);

            } catch (parseError) {
                console.log('Non-JSON output received, streaming raw output.');
                res.write(JSON.stringify({
                    status: 'in-progress',
                    rawOutput: output
                }) + '\n');

                // Publish raw progress updates to RabbitMQ
                sendMessageToQueue({
                    action: 'solver_progress_raw',
                    sessionId,
                    problemType,
                    rawOutput: output,
                    message: 'Solver raw output received'
                }, `execution_updates_${executionId}`);
            }
        });

        // Handle process completion
        solverProcess.on('close', (code) => {
            if (code === 0) {
                res.write(JSON.stringify({ status: 'completed', progress: 100 }) + '\n');
                res.end();

                // Publish completion event via RabbitMQ
                sendMessageToQueue({
                    action: 'solver_completed',
                    sessionId,
                    problemType,
                    message: 'Solver execution completed successfully',
                    progress: 100
                }, `execution_updates_${executionId}`);

            } else {
                res.write(JSON.stringify({
                    status: 'failed',
                    error: 'Solver process exited with non-zero code: ' + code
                }) + '\n');
                res.end();

                // Publish failure event to RabbitMQ
                sendMessageToQueue({
                    action: 'solver_failed',
                    sessionId,
                    problemType,
                    message: 'Solver process failed',
                    error: 'Solver process exited with non-zero code: ' + code
                }, `execution_updates_${executionId}`);
            }
        });

        // Handle errors from the solver process
        solverProcess.stderr.on('data', (data) => {
            console.error('Error in VRP Solver:', data.toString());
            res.write(JSON.stringify({ status: 'error', error: data.toString() }) + '\n');
            res.end();

            // Publish error event via RabbitMQ
            sendMessageToQueue({
                action: 'solver_error',
                sessionId,
                problemType,
                message: 'Solver encountered an error',
                error: data.toString()
            }, `execution_updates_${executionId}`);
        });

    } catch (error) {
        console.error('Error processing problem in OR-Tools:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to solve the problem.',
            error: error.message
        });
    }
};
