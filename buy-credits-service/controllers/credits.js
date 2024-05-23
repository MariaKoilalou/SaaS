const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.buyCredits = (req, res, next) => {
    const { sessionId, amount } = req.body;

    if (!sessionId || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid session ID or amount' });
    }

    models.Credits.create({
        sessionId: sessionId,
        amount: amount
    })
        .then(credit => {
            res.status(201).json({ success: true, message: 'Credits purchased successfully', credit });
        })
        .catch(err => {
            console.error('Error buying credits:', err);
            res.status(500).json({ success: false, message: 'Error buying credits', error: err.message });
        });
};

exports.totalCredits = (req, res, next) => {
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    models.Credits.sum('amount', { where: { sessionId: sessionId } })
        .then(total => {
            res.json({ success: true, sessionId, totalCredits: total || 0 });
        })
        .catch(err => {
            console.error('Error fetching total credits:', err);
            res.status(500).json({ success: false, message: 'Error fetching total credits', error: err.message });
        });
};

exports.status = (req, res, next) => {
    sequelize.authenticate()
        .then(() => res.status(200).json({ service: 'Credits Service', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - OK' }))
        .catch(err => res.status(500).json({ service: 'Credits Service', status: 'DOWN', uptime: Math.floor(process.uptime()), database: 'Connection - FAILED', error: err.message }));
};
