const axios = require('axios');
const encrypt = require('../utils/encrypt');
const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.submitProblem = async (req, res) => {
    const url = `http://submit_problem_service:4001/submit`;
    const headers = {
        "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES)),
        "Content-Type": "application/json"
    };

    try {
        const response = await axios.post(url, req.body, { headers });

        // Create or retrieve a session object
        let userSession = await models.Session.findByPk(req.session.id || 'defaultSessionId');
        if (!userSession) {
            userSession = models.Session.build({sid: req.session.id});
            req.session.save(); // Ensure session is saved
        }

        // Serialize session data correctly before saving
        userSession.data = JSON.stringify({problemId: response.data.problemId});
        await userSession.save();

        res.render('submitProblem.ejs', {
            message: 'Problem submitted successfully.',
            problemId: response.data.problemId,
            details: response.data.details,
            description: req.body.description
        });
    } catch (error) {
        console.error('Error submitting problem:', error.message);

        res.render('submitProblem.ejs', {
            error: 'Failed to submit problem. Please try again later.'

        });
    }
};
exports.browseProblems = async (req, res) => {
    const url = `http://browse_problems_service:4003/show`;
    const page = +req.query.page || 1;

    try {
        const response = await axios.post(url, { pageNumber: page }, {
            headers: {
                "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES)),
                "Content-Type": "application/json"
            }
        });

        // Check if session exists and create if necessary
        let userSession = await models.Session.findByPk(req.sessionID);
        if (!userSession) {
            userSession = models.Session.build({ sid: req.sessionID, data: JSON.stringify({}) });
        }

        // Update session data
        const sessionData = JSON.parse(userSession.data || '{}');
        sessionData.lastPageVisited = page;
        userSession.data = JSON.stringify(sessionData);
        await userSession.save();

        // Render the page with problem data
        res.render('browseProblems.ejs', {
            problems: response.data.problems,
            pagination: response.data.pagination,
            lastVisited: page // Show last visited page
        });
    } catch (error) {
        console.error('Error browsing problems:', error.message);

        req.flash('error', 'Error fetching problems. Please try again later.');
        res.redirect('/'); // Redirect to a default page on error
    }
};
