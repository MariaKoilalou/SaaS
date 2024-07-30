const axios = require('axios');

module.exports = async (req, res, next) => {
    const sessionId = req.headers['x-session-id']; // Assume session ID is sent in a custom header

    if (!sessionId) {
        return res.status(401).json({ message: 'Unauthorized: No session ID provided.' });
    }

    try {
        // Validate session by making a request to the frontend service
        const response = await axios.get(`http://front_end_service:4007/validate-session`, {
            headers: { 'x-session-id': sessionId }
        });

        if (response.status === 200 && response.data.isValid) {
            req.session = response.data.session; // Attach session data to the request object
            next();
        } else {
            return res.status(401).json({ message: 'Unauthorized: Invalid session.' });
        }
    } catch (error) {
        console.error('Error validating session:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
