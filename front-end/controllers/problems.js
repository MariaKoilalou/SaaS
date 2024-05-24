const axios = require('axios');
const encrypt = require('../utils/encrypt');
const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.submitProblem = async (req, res) => {
    const url = `http://${process.env.BASE_URL}:4001/create`;
    const headers = {
        "Content-Type": "application/json",
        "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    try {
        const response = await axios.post(url, req.body, { headers });

        // Create or retrieve a session object
        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = new models.Session({id: req.session.id});
        }

        // Update session with new data
        userSession.data.problemId = response.data.problemId;
        userSession.update();

        res.render('submitProblem.ejs', {
            message: 'Problem submitted successfully.',
            problemId: response.data.problemId,
            details: response.data.details
        });
    } catch (error) {
        console.error('Error submitting problem:', error.message);

        let userSession = await models.Session.findByPk(req.session.id);
        userSession.data.error = 'Failed to submit problem. Please try again later.';
        userSession.update();

        res.render('submitProblem.ejs', {
            error: userSession.data.error
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
        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = new models.Session({id: req.session.id});
        }
        userSession.data.lastPageVisited = page;
        userSession.update();

        // Render page with problem data
        res.render('browseProblems.ejs', {
            problems: response.data.problems,
            pagination: response.data.pagination,
            lastVisited: userSession.data.lastPageVisited // Optional: display last visited page
        });
    } catch (error) {
        console.error('Error browsing problems:', error.message);

        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = new models.Session({id: req.session.id});
        }
        userSession.data.error = 'Error fetching problems. Please try again later.';
        userSession.update();

        req.flash('error', userSession.data.error); // Use flash to show the error message
        res.redirect('/'); // Redirect to a default page on error
    }
};
