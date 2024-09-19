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

const stats = require('./routes/stats');
app.use(session({
    secret: process.env.SECRET_SESSION_STRING || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({
        db: sequelize,
        schema: process.env.DB_SCHEMA,
        tableName: 'Session',
        checkExpirationInterval: 15 * 60 * 1000,
        expiration: 24 * 60 * 60 * 1000
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Sync session store to create session table
store.sync();

app.use('/', stats);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

// Export the Express app
module.exports = app;
