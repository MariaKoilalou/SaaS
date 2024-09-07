const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Handle both rendering the form and submitting the problem
exports.submitProblem = async (req, res) => {
    const url = `http://submit_problem_service:4001/submit`;

    // If no problem data has been posted, render the form
    if (!req.body.problemData) {
        return res.render('submitProblem', {
            error: null, // No error initially
            message: null // No success message initially
        });
    }

    // If form data exists, handle the submission logic
    try {
        const { problemData, problemType } = req.body;

        // Check session balance
        const sessionBalance = req.session.balance;
        if (sessionBalance <= 0) {
            return res.render('submitProblem', {
                sessionBalance: req.session.balance || 0,
                error: 'Insufficient balance in session to submit the problem.',
                message: null
            });
        }

        // Prepare the payload for the problem microservice
        const payload = {
            problem: problemData,
            sessionId: req.session.id,
        };

        // Make a request to the submit problem microservice
        const response = await axios.post(url, payload);

        // Deduct balance after successful submission
        req.session.balance -= 1;
        await req.session.save(); // Save the updated session balance

        return res.render('submitProblem', {
            sessionBalance: req.session.balance || 0,
            error: null,
            message: 'Problem submitted successfully!'
        });

    } catch (error) {
        console.error('Error submitting problem:', error.message);
        return res.render('submitProblem', {
            sessionBalance: req.session.balance || 0,
            error: 'Internal server error. Unable to submit problem.',
            message: null
        });
    }
};


exports.browseProblems = async (req, res) => {
    const url = `http://browse_problems_service:4003/show`;

    try {
        // Send a POST request to fetch problems associated with this sessionId
        const response = await axios.post(url, {
            sessionId: req.session.id
        });

        // Render the page with problem data
        res.render('browseProblems.ejs', {
            problems: response.data.problems,
            pagination: response.data.pagination,
        });

    } catch (error) {
        // Flash an error message or render an error page
        req.flash('error', 'Error fetching problems. Please try again later.');
        res.redirect('/'); // Redirect the user to a default or error page
    }
};
