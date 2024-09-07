const axios = require('axios');

exports.submit = async (req, res) => {
    try {
        // Extract the problem and sessionId from the request body
        const { problem, sessionId, sessionBalance } = req.body;

        if (!problem || !sessionId) {
            return res.status(400).json({ message: 'Problem data and sessionId are required' });
        }


        // Check if the session balance is greater than zero
        if (sessionBalance <= 0) {
            return res.status(403).json({ message: 'Insufficient balance to submit the problem' });
        }

        // Decrease the session balance after successful submission
        const newBalance = sessionBalance - 1;

        return res.status(200).json({
            message: 'Problem submitted successfully',
        });

    } catch (error) {
        console.error('Error processing problem submission:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Unable to process the problem submission.',
            error: error.message
        });
    }
};