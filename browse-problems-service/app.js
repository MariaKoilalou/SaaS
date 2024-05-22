const express = require('express');
const cors = require('cors');

const browseQuestions = require('./routes/browseProblems');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// /* Routes used by our project */
app.use('/', layout);
app.use('/problems', show_questions);

app.use('/', browseProblems);

app.use((req, res, next) => { res.status(404).json({message: 'Endpoint not found!'}); })

// Export the Express app
module.exports = app;
