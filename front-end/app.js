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

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(flash());
// Initialize models
initModels(sequelize);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(flash());

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

// Define routes
const layout = require('./routes/layout');
const problems = require('./routes/problems');
const credits = require('./routes/credits');

app.use('/', layout);
app.use('/problems', problems);
app.use('/credits', credits);

app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

// Export the Express app
module.exports = app;
