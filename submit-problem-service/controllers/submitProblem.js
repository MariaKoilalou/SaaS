const axios = require('axios');

exports.submit = async (req, res) => {
    try {
        const { problemType, sessionId, sessionBalance, locationFile, numVehicles, depot, maxDistance, objectiveFunction, constraints, optGoal, itemWeights, itemValues, capacity } = req.body;

        // Log incoming data for debugging
        console.log('Problem Type:', problemType);
        console.log('Session ID:', sessionId);
        console.log('Session Balance:', sessionBalance);

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
        console.log('Submitting problem to microservice:', payload);

        // Here, you can simulate the problem submission to this microservice
        const newBalance = sessionBalance - 1;

        // Send the problem to other microservices
        const microservices = [
            'http://browse_problems_service:4003/problems',
            'http://manage_problems_service:4004/problems',
            // 'http://problem_stats_service:4006/problems'
        ];

        // Send the payload to each microservice
        const sendToMicroservices = microservices.map((serviceUrl) => {
            return axios.post(serviceUrl, payload)
                .then(() => {
                    console.log(`Problem sent to microservice: ${serviceUrl}`);
                })
                .catch((error) => {
                    console.error(`Error sending problem to ${serviceUrl}:`, error.message);
                });
        });

        // Wait for all requests to be sent
        await Promise.all(sendToMicroservices);

        // Return success response with updated session balance
        return res.status(200).json({
            message: 'Problem submitted successfully and sent to all microservices.',
            newBalance
        });

    } catch (error) {
        console.error('Error processing problem submission:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to process the problem submission.',
            error: error.message
        });
    }
};
