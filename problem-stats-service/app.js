const express = require('express');
const path = require('path');
const flash = require('connect-flash');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(flash());

const stats = require('./routes/stats');

app.use('/', stats);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

// Export the Express app
module.exports = app;
