const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// GET request to render the form
exports.renderSubmitProblemForm = (req, res) => {
    console.log('Rendering form - session balance:', req.session.balance);

    return res.render('submitProblem.ejs', {
        sessionBalance: req.session.balance || 0,
        error: null,
        message: null
    });
};

// POST request to handle form submission
exports.handleSubmitProblem = async (req, res) => {
    const url = `http://submit_problem_service:4001/submit`;

    console.log('Received a POST request to /submit');
    console.log('Request body:', req.body);

    try {
        // Extract values from the request body
        const { problemType, numVehicles, depot, maxDistance, locationFile, objectiveFunction, constraints, optGoal, itemWeights, itemValues, capacity } = req.body;

        // Get session balance and session ID from session
        const sessionBalance = req.session.balance;
        const sessionId = req.session.id;

        console.log('Session balance:', sessionBalance);
        console.log('Session ID:', sessionId);

        // Check if there is enough balance to submit the problem
        if (sessionBalance <= 0) {
            console.log('Insufficient balance');
            return res.render('submitProblem.ejs', {
                sessionBalance: sessionBalance || 0,
                error: 'Insufficient balance in session to submit the problem.',
                message: null
            });
        }

        // Build the payload to send to the submit problem microservice
        let payload = { problemType, sessionId, sessionBalance };

        // Add specific fields based on the problem type
        if (problemType === 'vrp') {
            payload = { ...payload, locationFile, numVehicles, depot, maxDistance };
        } else if (problemType === 'lp') {
            payload = { ...payload, objectiveFunction, constraints, optGoal };
        } else if (problemType === 'knapsack') {
            payload = {
                ...payload,
                itemWeights: itemWeights.split(',').map(Number),
                itemValues: itemValues.split(',').map(Number),
                capacity
            };
        }

        // Log the payload before sending the request
        console.log('Sending POST request to submit problem microservice with payload:', payload);

        // Send the request to the submit problem microservice
        const response = await axios.post(url, payload);

        // Handle successful response
        if (response.status === 200) {
            console.log('Problem submitted successfully, deducting balance...');
            req.session.balance -= 1;
            await req.session.save();  // Save updated balance in session

            // Retrieve executionId and executionResult from response
            const executionId = response.data.executionResult.executionId;
            const executionResult = response.data.executionResult;

            console.log('Execution started with ID:', executionId);

            // Redirect to the manageProblem.ejs page with execution data
            return res.render('manageProblem.ejs', {
                sessionBalance: req.session.balance || 0,
                executionId: executionId,
                executionResult: executionResult,
                error: null,
                message: 'Problem submitted and execution started successfully!'
            });
        } else {
            // Handle failure to submit problem
            console.log('Problem submission failed:', response.data.message);
            return res.render('submitProblem.ejs', {
                sessionBalance: req.session.balance || 0,
                error: `Failed to submit problem: ${response.data.message}`,
                message: null
            });
        }
    } catch (error) {
        // Handle any errors during the process
        console.error('Error submitting problem:', error.message);
        return res.render('submitProblem.ejs', {
            sessionBalance: req.session.balance || 0,
            error: 'Internal server error. Unable to submit problem.',
            message: null
        });
    }
};

// Browse problems logic
exports.browseProblems = async (req, res) => {
    const url = `http://browse_problems_service:4003/show`;

    console.log('Fetching problems for sessionId:', req.session.id);

    try {
        // Send a POST request to fetch problems associated with this sessionId
        const response = await axios.post(url, {
            sessionId: req.session.id
        });

        console.log('Received problems:', response.data.problems);

        // Render the page with problem data
        res.render('browseProblems.ejs', {
            problems: response.data.problems,
            pagination: response.data.pagination,
        });

    } catch (error) {
        console.error('Error fetching problems:', error.message);
        req.flash('error', 'Error fetching problems. Please try again later.');
        res.redirect('/'); // Redirect the user to a default or error page
    }
};
