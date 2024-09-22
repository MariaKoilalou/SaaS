const axios = require('axios');

exports.submit = async (req, res) => {
    try {
        const { problemType, sessionId, sessionBalance, locationFile, numVehicles, depot, maxDistance, objectiveFunction, constraints, optGoal, itemWeights, itemValues, capacity } = req.body;

        // Check if problemType and sessionId are provided
        if (!problemType || !sessionId) {
            return res.status(400).json({ message: 'Problem type and sessionId are required' });
        }

        // Check if session balance is valid
        if (sessionBalance === undefined || sessionBalance <= 0) {
            return res.status(403).json({ message: 'Insufficient balance to submit the problem' });
        }

        // Prepare payload for problem type
        let payload = { problemType, sessionId };

        if (problemType === 'vrp') {
            if (!locationFile || !numVehicles || depot === undefined || !maxDistance) {
                return res.status(400).json({ message: 'Missing required parameters for VRP' });
            }
            payload.locationFile = locationFile;
            payload.numVehicles = numVehicles;
            payload.depot = depot;
            payload.maxDistance = maxDistance;
        } else if (problemType === 'lp') {
            if (!objectiveFunction || !constraints || !optGoal) {
                return res.status(400).json({ message: 'Missing required parameters for LP' });
            }
            payload.objectiveFunction = objectiveFunction;
            payload.constraints = constraints;
            payload.optGoal = optGoal;
        } else if (problemType === 'knapsack') {
            if (!itemWeights || !itemValues || !capacity) {
                return res.status(400).json({ message: 'Missing required parameters for Knapsack' });
            }
            payload.itemWeights = itemWeights.split(',').map(Number);
            payload.itemValues = itemValues.split(',').map(Number);
            payload.capacity = capacity;
        } else {
            return res.status(400).json({ message: 'Invalid problem type' });
        }

        // Log payload before sending
        console.log('Submitting problem to manage problem service:', payload);

        // Simulate session balance deduction
        const newBalance = sessionBalance - 1;

        // Send the problem to the manage_problems_service and start execution
        const manageServiceUrl = 'http://manage_problems_service:4004/problems';

        try {
            const manageResponse = await axios.post(manageServiceUrl, {
                ...payload,
                sessionId,
                newBalance
            });

            // Extract the executionId from the response
            const executionId = manageResponse.data.executionId;
            console.log('Received executionId from manage_problems_service:', executionId);

            // Update the balance in credits service
            const creditsServiceUrl = 'http://credits_service:4002/credits/update';
            try {
                await axios.post(creditsServiceUrl, {
                    sessionId,
                    newBalance
                });
                console.log('New balance updated in credits_service:', newBalance);

                return res.status(200).json({
                    message: 'Problem submitted successfully',
                    newBalance,
                    executionId
                });

            } catch (creditsError) {
                console.error('Error updating balance in credits_service:', creditsError.message);
                return res.status(500).json({
                    message: 'Problem submitted, but failed to update balance in credits_service.',
                    executionId,
                    error: creditsError.message
                });
            }

        } catch (manageError) {
            console.error('Error sending problem to manage_problems_service:', manageError.message);
            return res.status(500).json({
                message: 'Failed to submit problem to manage_problems_service.',
                error: manageError.message
            });
        }

    } catch (error) {
        console.error('Error processing problem submission:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to process the problem submission.',
            error: error.message
        });
    }
};
