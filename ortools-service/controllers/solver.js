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
        const scriptPath = path.resolve(__dirname, '../vrpsolver.py');  // Assuming the script is in the parent directory

        // Construct the command to run the Python script
        const command = `python3 ${scriptPath} --location_file ${locationFile} --num_vehicles ${numVehicles} --depot ${depot} --max_distance ${maxDistance}`;

        console.log('Executing command:', command);

        // Execute the Python script with the constructed command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing VRP solver:', error);
                return res.status(500).json({
                    message: 'Error solving the problem with OR-Tools.',
                    error: stderr || error.message
                });
            }

            console.log('VRP Solver Output:', stdout);

            // Parse the output from the Python script (assuming it's JSON)
            let result;
            try {
                result = JSON.parse(stdout);
            } catch (parseError) {
                console.error('Error parsing solver output:', parseError);
                return res.status(500).json({
                    message: 'Error parsing the solver output.',
                    error: parseError.message
                });
            }

            // Send the result back to the manage problem service or frontend
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


