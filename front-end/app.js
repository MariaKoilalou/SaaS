const express = require('express');
const path = require('path');
const app = express();

const layout = require('./routes/layout');

// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));


// /* Routes used by our project */
app.use('/', layout);

app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

app.get('/problems', (req, res) => {
    res.render('problems', { title: 'Problems Page' });
});

// Export the Express app
module.exports = app;
