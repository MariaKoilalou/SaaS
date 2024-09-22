const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);

exports.getBalance = async (req, res) => {
    const sessionId = req.query.sessionId;  // Get sessionId from query params
    console.error(`fetching balance for ${sessionId}`);

    try {
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });

        if (!sessionData) {
            return res.status(404).json({ message: 'Session not found', balance: 0 });
        }

        const sessionParsedData = JSON.parse(sessionData.data || '{}');
        const balance = sessionParsedData.balance || 0;

        return res.status(200).json({ balance });
    } catch (error) {
        console.error('Error fetching session balance:', error.message);
        return res.status(500).json({ message: 'Internal server error', balance: 0 });
    }
};


exports.buyCredits = async (req, res) => {
    const creditsToAdd = req.body.credits;
    const sessionId = req.body.sessionId;
    const currentBalance = Number(req.body.currentBalance);

    // Ensure current balance is a valid number
    const currentBalanceNum = isNaN(currentBalance) ? 0 : currentBalance;

    console.log('buy: Received request. Session ID:', sessionId, 'Credits to add:', creditsToAdd, 'Current Balance:', currentBalanceNum);

    try {
        // Find session by sessionId
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });
        console.log('Session data found:', sessionData);

        // If session doesn't exist, create a new one
        if (!sessionData) {
            console.log(`Session ${sessionId} not found, creating a new one.`);
            const newBalance = Number(creditsToAdd);  // Initial balance is equal to credits added

            sessionData = await models.Session.create({
                sid: sessionId,
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiration
                data: JSON.stringify({ balance: newBalance }) // Store the initial balance
            });
            console.log('New session created with balance:', newBalance);

            return res.status(200).json({
                message: 'Credits added successfully.',
                creditsAdded: creditsToAdd,
                newBalance: newBalance
            });
        }

        // Parse the session data to get the current balance stored in session
        let sessionParsedData = JSON.parse(sessionData.data || '{}');
        const existingBalance = sessionParsedData.balance || 0;

        // Add credits to the existing balance
        const creditsToAddNum = Number(creditsToAdd);
        const newBalance = existingBalance + creditsToAddNum;

        // Update session data with new balance
        sessionParsedData.balance = newBalance;
        sessionData.data = JSON.stringify(sessionParsedData);  // Save back to session
        await sessionData.save();  // Save updated session data

        console.log('buy: Updated session balance saved. New Balance:', newBalance);

        // Return success response
        return res.status(200).json({
            message: 'Credits added successfully.',
            creditsAdded: creditsToAdd,
            newBalance: newBalance
        });

    } catch (error) {
        console.error('buy: Error adding credits:', error);
        return res.status(500).json({
            message: 'Internal server error. Failed to add credits.'
        });
    }
};

exports.updateCredits = async (req, res) => {
    const { sessionId, newBalance } = req.body;

    // Validate the request payload
    if (!sessionId || newBalance === undefined) {
        return res.status(400).json({
            message: 'SessionId and newBalance are required'
        });
    }

    try {
        // Find the session data by sessionId
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });

        if (!sessionData) {
            return res.status(404).json({
                message: 'Session not found'
            });
        }

        let sessionParsedData = JSON.parse(sessionData.data || '{}');
        sessionParsedData.balance = newBalance;  // Update balance

        // Save the updated balance back to session data
        sessionData.data = JSON.stringify(sessionParsedData);
        await sessionData.save();  // Save updated session data to the database

        console.log(`Balance for session ${sessionId} updated to ${newBalance}`);

        return res.status(200).json({
            message: 'Balance updated successfully',
            sessionId,
            newBalance
        });

    } catch (error) {
        console.error('Error updating balance:', error.message);
        return res.status(500).json({
            message: 'Internal server error. Failed to update balance.',
            error: error.message
        });
    }
};