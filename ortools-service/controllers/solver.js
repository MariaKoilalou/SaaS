const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.solver = async (req, res) => {
    try {
        const { problemType, problemDetails, sessionId } = req.body;

        // Validate the incoming data
        if (!problemType || !problemDetails || problemType !== 'vrp') {
            return res.status(400).json({ message: 'Invalid or missing problem type or problem details.' });
        }

        console.log('Received VRP problem for OR-Tools:', problemDetails);

        // Extract parameters from problemDetails
        const { locationFile, numVehicles, depot, maxDistance } = problemDetails;

        if (!locationFile || !numVehicles || depot === undefined || !maxDistance) {
            return res.status(400).json({ message: 'Missing required VRP parameters.' });
        }

        // Define the correct path to the Python script located outside the current directory
        const scriptPath = path.resolve(__dirname, 'vrpSolver.py');  // Python VRP solver script
        const locationFilePath = path.resolve(__dirname, locationFile);  // Path to the location file

        if (!fs.existsSync(locationFilePath)) {
            return res.status(400).json({ message: 'Location file not found.' });
        }

        // Construct the command to run the Python script using spawn
        const command = `python3 ${scriptPath} ${locationFilePath} ${numVehicles} ${depot} ${maxDistance}`;

        console.log('Executing command:', command);

        // Use spawn to execute the Python script and stream the output
        const solverProcess = spawn('python3', [scriptPath, locationFilePath, numVehicles, depot, maxDistance]);

        // Set response headers for streaming
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Send initial progress update to the client
        res.write(JSON.stringify({ status: 'started', progress: 0 }) + '\n');

        // Capture real-time output from the Python script
        solverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('VRP Solver Output:', output);

            // Parse progress or partial results from the output
            try {
                const progressUpdate = JSON.parse(output);
                // Send partial results/progress to the client
                res.write(JSON.stringify({
                    status: 'in-progress',
                    progress: progressUpdate.progress || null,
                    partialResult: progressUpdate.partialResult || null
                }) + '\n');
            } catch (parseError) {
                console.log('Non-JSON output received, streaming raw output.');
                res.write(JSON.stringify({
                    status: 'in-progress',
                    rawOutput: output
                }) + '\n');
            }
        });

        // Handle process completion
        solverProcess.on('close', (code) => {
            if (code === 0) {
                res.write(JSON.stringify({ status: 'completed', progress: 100 }) + '\n');
                res.end();
            } else {
                res.write(JSON.stringify({
                    status: 'failed',
                    error: 'Solver process exited with non-zero code: ' + code
                }) + '\n');
                res.end();
            }
        });

        // Handle errors from the solver process
        solverProcess.stderr.on('data', (data) => {
            console.error('Error in VRP Solver:', data.toString());
            res.write(JSON.stringify({ status: 'error', error: data.toString() }) + '\n');
            res.end();
        });

    } catch (error) {
        console.error('Error processing problem in OR-Tools:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to solve the problem.',
            error: error.message
        });
    }
};



