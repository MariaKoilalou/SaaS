const express = require('express');
const router = express.Router();

router.get('/validate-session', (req, res) => {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
        return res.status(400).json({ message: 'No session ID provided.' });
    }

    // Fetch session from store
    req.sessionStore.get(sessionId, (err, session) => {
        if (err || !session) {
            return res.status(401).json({ isValid: false, message: 'Invalid session.' });
        }

        res.status(200).json({ isValid: true, session });
    });
});

module.exports = router;
