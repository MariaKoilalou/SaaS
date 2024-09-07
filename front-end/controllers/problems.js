const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const fs = require('fs');
const FormData = require('form-data');
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const multer = require('multer');

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadFile = upload.single('pythonFile');  // 'pythonFile' is the field name for file input in the form

exports.submitProblem = async (req, res) => {
    const url = `http://submit_problem_service:4001/submit`;

    // Ensure the file is provided in the request
    if (!req.file) {
        return res.status(400).json({ message: 'No file provided. Please upload a .py file.' });
    }

    try {
        // Prepare the form data to send the Python file in memory
        const formData = new FormData();
        formData.append('pythonFile', req.file.buffer, {
            filename: req.file.originalname,  // Original file name
            contentType: req.file.mimetype    // File MIME type
        });


        // Add session ID if required
        if (req.session && req.session.id) {
            formData.append('sessionId', req.session.id);  // Attach session ID if available
        }

        // Make a POST request to the Submit Problem microservice without waiting for a response
        axios.post(url, formData, {
            headers: {
                "Custom-Services-Header": encrypt(process.env.SECRET_STRING_SERVICES),  // Optional: Add custom header
                ...formData.getHeaders()  // Set appropriate headers for multipart/form-data
            }
        }).then((response) => {
            console.log('Problem submitted successfully:', response.data);
        }).catch((error) => {
            console.error('Error submitting problem:', error.message);
        });


    } catch (error) {
        console.error('Error response data:', error.response ? error.response.data : 'No response data');
        console.error('Error submitting problem:', error.message);

        // Handle errors gracefully
        return res.status(500).json({
            message: 'Internal server error. Unable to submit problem.',
            error: error.message
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
