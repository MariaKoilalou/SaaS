const express = require('express');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./utils/database');
var initModels = require("./models/init-models");
const flash = require('connect-flash')

const app = express();

const layout = require('./routes/layout');
const problems = require('./routes/problems');
const credits = require('./routes/credits');
initModels(sequelize);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());

app.use(session({
    secret: process.env.SECRET_SESSION_STRING,
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({
        db: sequelize,
        table: 'Session',
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));

// /* Routes used by our project */
app.use('/', layout);
app.use('/problems', problems);
app.use('/credits', credits);

app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

// Export the Express app
module.exports = app;