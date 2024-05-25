const axios = require('axios');
const encrypt = require('../utils/encrypt');
const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.submitProblem = async (req, res) => {
    const url = `http://${process.env.BASE_URL}:4001/create`;
    const headers = {
        "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
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
            details: response.data.details
        });
    } catch (error) {
        console.error('Error submitting problem:', error.message);

        res.render('submitProblem.ejs', {
            error: 'Failed to submit problem. Please try again later.'
        });
    }
};

exports.browseProblems = async (req, res) => {
    const url = `http://${process.env.BASE_URL}:4003/show`;
    const page = +req.query.page || 1;

    try {
        const response = await axios.post(url, { pageNumber: page }, {
            headers: {
                "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
            }
        });

        // Update or retrieve session information
        let userSession = await models.Session.findByPk(req.session.id || 'defaultSessionId');
        if (!userSession) {
            userSession = models.Session.build({sid: req.session.id});
            req.session.save(); // Ensure session is saved
        }

        // Serialize session data correctly before saving
        userSession.data = JSON.stringify({lastPageVisited: page});
        await userSession.save();

        // Render page with problem data
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