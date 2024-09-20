const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

exports.buy = async (req, res) => {
    const creditsToAdd = req.body.credits;
    const sessionId = req.body.sessionId;

    console.log('buy: Received request. Session ID:', sessionId, 'Credits to add:', creditsToAdd);

    try {
        // Override session ID with the provided one
        req.sessionID = sessionId;  // Use the session ID passed from the frontend

        // Retrieve session data using the session ID
        req.sessionStore.get(sessionId, (err, sessionData) => {
            if (err) {
                console.error('Error fetching session:', err);
                return res.status(500).json({ message: 'Failed to retrieve session.' });
            }

            // Step 2: If session doesn't exist, create a new session with the same session ID
            if (!sessionData) {
                console.log('Session not found, creating a new one for session ID:', sessionId);
                sessionData = {
                    balance: 0  // Initialize with zero balance
                };
            }

            const currentBalance = Number(sessionData.balance) || 0;  // Ensure balance is a number
            const creditsToAddNum = Number(creditsToAdd);  // Ensure creditsToAdd is a number
            const newBalance = currentBalance + creditsToAddNum;
            sessionData.balance = newBalance;  // Store the updated balance as a number

            // Save the updated session data
            req.sessionStore.set(req.sessionID, sessionData, (saveErr) => {
                if (saveErr) {
                    console.error('Error saving session:', saveErr);
                    return res.status(500).json({ message: 'Failed to save session.' });
                }

                console.log('buy: Updated session balance saved. New Balance:', newBalance);
                return res.status(200).json({
                    message: 'Credits added successfully.',
                    creditsAdded: creditsToAdd,
                    newBalance: newBalance
                });
            });


        });
    } catch (error) {
        console.error('buy: Error adding credits:', error);
        return res.status(500).json({
            message: 'Internal server error. Failed to add credits.'
        });
    }
};
