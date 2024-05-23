const express = require('express');
const cors = require('cors');

const submitProblem = require('./routes/submitProblem');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', submitProblem);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

module.exports = app;