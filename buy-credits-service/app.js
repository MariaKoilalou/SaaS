const express = require('express');
const cors = require('cors');

const buyCredits = require('./routes/credits');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', buyCredits);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

// Export the Express app
module.exports = app;
