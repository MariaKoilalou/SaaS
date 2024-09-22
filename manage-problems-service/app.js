const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const sequelize = require('./utils/database');
const store = require('./utils/sessionStore'); // Import the session store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const initModels = require("./models/init-models");

const app = express(); // Initialize express

// Initialize models
initModels(sequelize);

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Flash middleware
app.use(flash());

// Define session configuration
app.use(session({
    secret: process.env.SECRET_SESSION_STRING || 'default_secret',
    resave: false,  // Avoid resaving session if it hasn't been modified
    saveUninitialized: false,  // Don't create sessions for unauthenticated users
    store: new SequelizeStore({
        db: sequelize,
        schema: process.env.DB_SCHEMA,
        tableName: 'Session',  // Ensure this matches the table in your database
        checkExpirationInterval: 15 * 60 * 1000,  // Clear expired sessions every 15 minutes
        expiration: 24 * 60 * 60 * 1000  // Sessions expire after 24 hours
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000  // 24-hour expiration for cookies
    }
}));

// Sync session store to ensure the session table is created
store.sync();

// Import routes
const manageProblems = require('./routes/manageProblems');
app.use('/', manageProblems);

// 404 error handler
app.use((req, res, next) => {
    res.status(404).json({message: 'Endpoint not found!'});
});

module.exports = app;
