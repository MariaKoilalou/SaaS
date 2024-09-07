const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const sequelize = require('./utils/database');
const store = require('./utils/sessionStore'); // Import the session store
var initModels = require("./models/init-models");
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const app = express();

// Initialize models
initModels(sequelize);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(flash());

const browseProblems = require('./routes/browseProblems');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Sync session store to create session table
store.sync();
app.use('/', browseProblems);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

// Export the Express app
module.exports = app;
