const { exec } = require('child_process');
const path = require('path');

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
        const scriptPath = path.resolve(__dirname, 'vrpSolver.py');  // Assuming the script is in the parent directory
        const locationFilePath = path.resolve(__dirname, 'locations_20.json');

        // Construct the command to run the Python script
        const command = `python3 ${scriptPath} ${locationFilePath} ${numVehicles} ${depot} ${maxDistance}`;

        console.log('Executing command:', command);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing VRP solver:', error);
                return res.status(500).json({
                    message: 'Error solving the problem with OR-Tools.',
                    error: stderr || error.message
                });
            }

            console.log('VRP Solver Output:', stdout);

            // Check if the output contains "No solution found"
            if (stdout.includes('No solution found')) {
                return res.status(200).json({
                    message: 'No solution found for the given VRP problem.'
                });
            }

            let result;
            try {
                result = JSON.parse(stdout); // Try to parse the output if it's valid JSON
            } catch (parseError) {
                console.error('Error parsing solver output:', parseError);
                return res.status(500).json({
                    message: 'Error parsing the solver output. The solver did not return a valid solution.',
                    error: parseError.message
                });
            }

            return res.status(200).json({
                message: 'VRP problem solved successfully.',
                result
            });
        });

    } catch (error) {
        console.error('Error processing problem in OR-Tools:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to solve the problem.',
            error: error.message
        });
    }
};


