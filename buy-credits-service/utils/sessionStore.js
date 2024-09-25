const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./database'); // Ensure this points to your shared database

// Create Session Store
const store = new SequelizeStore({
    db: sequelize,
    tableName: 'Session',
    checkExpirationInterval: 15 * 60 * 1000, // Check expired sessions every 15 minutes
    expiration: 24 * 60 * 60 * 1000 // Session expires after 24 hours
});

module.exports = store;