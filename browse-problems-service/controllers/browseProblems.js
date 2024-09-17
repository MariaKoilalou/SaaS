const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const PROBLEMS_PER_PAGE = 7;

exports.show = async (req, res) => {
    const sessionId = req.body.sessionId;

    console.log('show: Received request for sessionId:', sessionId);

    try {
        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required.' });
        }

        // Count the total number of problems for this sessionId
        const totalProblems = await models.Problem.count({
            where: { sessionId: sessionId }
        });

        // If there are no problems, return an empty response with pagination metadata
        if (totalProblems === 0) {
            return res.status(200).json({
                pagination: {
                    totalProblems: 0,
                    totalPages: 1,
                    problemsPerPage: PROBLEMS_PER_PAGE
                },
                problems: []
            });
        }

        // Calculate total pages based on total problems
        const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE);

        // Fetch all problems for the sessionId without pagination (since we're not dealing with page numbers)
        const problems = await models.Problem.findAll({
            where: { sessionId: sessionId }, // Fetch only problems for the specified sessionId
            order: [['dateCreated', 'ASC']] // Order by creation date
        });

        // Format the problems array for the response
        const problemsArr = problems.map(problem => ({
            id: problem.id,
            title: problem.title,
            description: problem.description,
            dateCreated: new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
            }).format(new Date(problem.dateCreated))
        }));

        // Respond with the total number of problems and calculated total pages
        return res.status(200).json({
            pagination: {
                totalProblems: totalProblems,
                totalPages: totalPages,
                problemsPerPage: PROBLEMS_PER_PAGE
            },
            problems: problemsArr
        });
    } catch (err) {
        console.error('Error fetching problems:', err);
        return res.status(500).json({ message: 'Internal server error.', type: 'error' });
    }
};

exports.problems = async (req, res) => {
    try {
        // Extract problem data from the request body
        const problemData = req.body;

        console.log('Received problem in Browse Problem Service:', problemData);

        // Validate the incoming problem data
        if (!problemData.problemType || !problemData.sessionId) {
            return res.status(400).json({ message: 'Problem type and sessionId are required' });
        }

        // Save the problem data in the database for browsing purposes
        // Assuming you have a Problem model and a `create` function
        const newProblem = await models.Problem.create({
            problemType: problemData.problemType,
            sessionId: problemData.sessionId,
            problemDetails: problemData,  // You can store all problem details in one column or break them into individual columns as needed
        });

        console.log('Problem saved in Browse Problem Service:', newProblem);

        // Send success response back to the Submit Problem Service
        return res.status(200).json({ message: 'Problem saved successfully in Browse Problem Service' });
    } catch (error) {
        console.error('Error saving problem in Browse Problem Service:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};