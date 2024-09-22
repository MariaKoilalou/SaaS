const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

exports.buy = async (req, res) => {
    const creditsToAdd = req.body.credits;
    const sessionId = req.body.sessionId;
    const currentBalance = Number(req.body.currentBalance);  // Ensure the current balance is parsed correctly

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

