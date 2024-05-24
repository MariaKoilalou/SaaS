const sequelize = require('../utils/database');
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.stats = async (req, res) => {
    try {
        // Fetch all stats, including the associated problem details
        const statistics = await Stats.findAll({
            include: [{
                model: Problems,
                as: 'problem'  // Make sure your model association uses this alias
            }]
        });
        res.json({ success: true, data: statistics });
    } catch (error) {
        console.error('Failed to retrieve statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve statistics', error: error.message });
    }
};


exports.status = (req, res, next) => {

    sequelize.authenticate()
        .then(() => res.status(200).json({ service: 'Analytics', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - OK' }))
        .catch(err => res.status(200).json({ service: 'Analytics', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - FAILED' }))

}