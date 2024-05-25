const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.buyCredits = async (req, res) => {
    const { sessionId, amount } = req.body;

    // Validate input
    if (!sessionId || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid session ID or amount' });
    }

    try {
        // Create a new credit transaction record
        const credit = await models.Credits.create({
            sessionId: sessionId,
            amount: amount,
            transactionDate: new Date() // explicitly set the transaction date
        });

        // Respond with success
        res.status(201).json({
            success: true,
            message: 'Credits purchased successfully',
            transactionId: credit.id, // provide transaction ID for reference
            amount: credit.amount,
            transactionDate: credit.transactionDate
        });
    } catch (err) {
        console.error('Error buying credits:', err);
        res.status(500).json({
            success: false,
            message: 'Error buying credits',
            error: err.message
        });
    }
};



exports.totalCredits = async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    try {
        // Calculate the sum of all credit amounts for the given session ID
        const total = await models.Credits.sum('amount', {
            where: { sessionId: sessionId }
        });

        res.json({
            success: true,
            sessionId: sessionId,
            totalCredits: total || 0 // Return 0 if no credits found
        });
    } catch (err) {
        console.error('Error fetching total credits:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching total credits',
            error: err.message
        });
    }
};


exports.status = (req, res, next) => {
    sequelize.authenticate()
        .then(() => res.status(200).json({ service: 'Credits Service', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - OK' }))
        .catch(err => res.status(500).json({ service: 'Credits Service', status: 'DOWN', uptime: Math.floor(process.uptime()), database: 'Connection - FAILED', error: err.message }));
};
