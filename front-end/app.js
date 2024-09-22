const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const sequelize = require('./utils/database'); // Sequelize instance for DB connection
const SequelizeStore = require('connect-session-sequelize')(session.Store); // Sequelize session store
const store = require('./utils/sessionStore'); // Import the session store

const app = express();

// Import routes
const layout = require('./routes/layout');
const problems = require('./routes/problems');
const credits = require('./routes/credits');
const execution = require('./routes/execution');


// Initialize models
var initModels = require("./models/init-models");
initModels(sequelize);  // Initialize the models

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Flash messages
app.use(flash());

// Session middleware
app.use(session({
    secret: process.env.SECRET_SESSION_STRING || 'default_secret',  // Secret for session encryption
    resave: false,  // Don't resave session if it hasn't changed
    saveUninitialized: false,  // Don't create session until something is stored in it
    store: new SequelizeStore({
        db: sequelize,
        schema: process.env.DB_SCHEMA,
        tableName: 'Session',  // Use a specific table for session storage
        checkExpirationInterval: 15 * 60 * 1000,  // Clear expired sessions every 15 minutes
        expiration: 24 * 60 * 60 * 1000  // Sessions expire after 24 hours
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000  // Cookie expiration (24 hours)
    }
}));

// Sync session store to create session table
store.sync();

// Define routes
app.use('/', layout);        // General layout routes
app.use('/problems', problems);  // Problem-related routes
app.use('/credits', credits);  // Credit-related routes
app.use('/execution', execution);


// Home route
app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

// Export the Express app
module.exports = app;
