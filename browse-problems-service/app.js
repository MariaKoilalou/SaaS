const express = require('express');
const cors = require('cors');
const validateSession = require('./middleware/validateSession');

const browseProblems = require('./routes/browseProblems');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Use session validation middleware
app.use(validateSession);

app.use('/', browseProblems);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

// Export the Express app
module.exports = app;
