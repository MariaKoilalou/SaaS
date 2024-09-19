const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const sequelize = require('./utils/database');
const store = require('./utils/sessionStore'); // Import the session store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const socket = require('./utils/socket'); // Import socket setup utility
const initModels = require("./models/init-models");

const app = express(); // Initialize express
const http = require('http'); // Import http module to create server
const server = http.createServer(app); // Create HTTP server from express app

// Initialize models
initModels(sequelize);

// Initialize Socket.io with the HTTP server
const io = socket.init(server);

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

// Socket.io connection handling (optional)
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Export the HTTP server instead of the express app
module.exports = server;

