const express = require('express');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./utils/database');
var initModels = require("./models/init-models");
const flash = require('connect-flash')

const app = express();

const layout = require('./routes/layout');
const show_questions = require('./routes/problems');
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
        table: 'Sessions',
    }),
}));

// /* Routes used by our project */
app.use('/', layout);
app.use('/problems', show_questions);

app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

app.get('/problems', (req, res) => {
    res.render('problems', { title: 'Problems Page' });
});

// Export the Express app
module.exports = app;
