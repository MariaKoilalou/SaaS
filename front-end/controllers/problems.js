const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

exports.showManageProblem = (req, res) => {
    const { executionId, status, progress, result, metaData } = req.body;

    // Render the manage problem page, passing the execution data to the EJS template
    res.render('manageProblem.ejs', {
        executionId: executionId,
        status: status ? status : 'Pending',
        progress: progress ? progress.progress : 0,
        result: result ? result.result : 'Not available',
        metaData: metaData ? metaData.metaData : 'No metadata'
    });
};

exports.renderSubmitProblemForm = (req, res) => {
    console.log('Rendering form - session balance:', req.session.balance);

    return res.render('submitProblem.ejs', {
        sessionBalance: req.session.balance || 0,
        error: null,
        message: null
    });
};

exports.handleSubmitProblem = async (req, res) => {
    const submitProblemUrl = `http://submit_problem_service:4001/submit`;

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

        // Send the problem to submit_problem_service
        const response = await axios.post(submitProblemUrl, payload);

        if (response.status !== 200) {
            console.log('Problem submission failed:', response.data.message);
            return res.render('submitProblem.ejs', {
                sessionBalance: req.session.balance || 0,
                error: `Failed to submit problem: ${response.data.message}`,
                message: null
            });
        } else {
            const executionId = response.data.executionId;

            console.log('Received executionId from submit_problem_service:', executionId);

            // Deduct 1 from session balance
            req.session.balance -= 1;
            await req.session.save();  // Save updated balance in session

            // Redirect to manage page with the executionId
            return res.redirect(`manage/${executionId}`);  // Pass the executionId to the manage page
        }
    } catch (error) {
        console.error('Error submitting problem:', error.message);
        return res.render('submitProblem.ejs', {
            sessionBalance: req.session.balance || 0,
            error: 'Internal server error. Unable to submit problem.',
            message: null
        });
    }
};



exports.browseProblems = async (req, res) => {
    const url = `http://browse_problems_service:4003/show`;

    console.log('Fetching problems for sessionId:', req.session.id);

    try {
        // Send a POST request to fetch problems associated with this sessionId
        const response = await axios.post(url, {
            sessionId: req.session.id,
            page: req.query.page || 1  // Handling pagination
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

exports.getProblemStatus = async (req, res) => {
    const url = `http://browse_problems_service:4003/status`; // The Browse Problems Service status endpoint

    try {
        // Send a GET request to fetch status updates for the session
        const response = await axios.get(url, {
            params: { sessionId: req.session.id }  // Pass sessionId as a query parameter
        });

        // Send the status updates back to the frontend (browser) as JSON
        res.json(response.data);

    } catch (error) {
        console.error('Error fetching status updates:', error.message);
        res.status(500).json({ message: 'Error fetching problem status updates.' });
    }
};


exports.deleteProblem = async (req, res) => {
    const problemId = req.params.problemId;
    const manageServiceUrl = `http://manage_problems_service:4004/delete/${problemId}`;
    const browseServiceUrl = `http://browse_problems_service:4003/delete/${problemId}`;

    try {
        await axios.post(`${browseServiceUrl}`);
        console.log(`Problem ${problemId} deleted from Browse Problem Service.`);
    } catch (browseError) {
        console.error(`Failed to delete problem ${problemId} from Browse Problem Service:`, browseError.message);
        return res.status(500).json({ message: `Failed to delete problem from Browse Problem Service: ${browseError.message}` });
    }

    try {
        await axios.post(manageServiceUrl);
        await exports.browseProblems(req, res);

    } catch (error) {
        req.flash('error', `Error deleting problem: ${error.message}`);
        return res.redirect('/');
    }
};