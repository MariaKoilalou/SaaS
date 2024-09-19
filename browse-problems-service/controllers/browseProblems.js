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
        // Override session ID with the provided one
        req.sessionID = sessionId;

        // Retrieve session data using the session ID
        req.sessionStore.get(sessionId, async (err, sessionData) => {
            if (err) {
                console.error('Error fetching session:', err);
                return res.status(500).json({ message: 'Failed to retrieve session.' });
            }

            if (!sessionData) {
                console.log('Session not found for sessionId:', sessionId);
                return res.status(400).json({ message: 'Invalid session.' });
            }

            // Fetch problem data based on session
            const totalProblems = await models.Problem.count({
                where: { sessionId: sessionId }
            });

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

            const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE);

            const problems = await models.Problem.findAll({
                where: { sessionId: sessionId },
                order: [['dateCreated', 'ASC']]
            });

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

            return res.status(200).json({
                pagination: {
                    totalProblems: totalProblems,
                    totalPages: totalPages,
                    problemsPerPage: PROBLEMS_PER_PAGE
                },
                problems: problemsArr
            });
        });
    } catch (err) {
        console.error('Error fetching problems:', err);
        return res.status(500).json({ message: 'Internal server error.', type: 'error' });
    }
};

exports.getProblem = async (req, res) => {
    const sessionId = req.body.sessionId;

    console.log('getProblem: Received request for sessionId:', sessionId);

    try {
        // Override session ID with the provided one
        req.sessionID = sessionId;

        // Retrieve session data using the session ID
        req.sessionStore.get(sessionId, async (err, sessionData) => {
            if (err) {
                console.error('Error fetching session:', err);
                return res.status(500).json({ message: 'Failed to retrieve session.' });
            }

            if (!sessionData) {
                console.log('Session not found for sessionId:', sessionId);
                return res.status(400).json({ message: 'Invalid session.' });
            }

            const problemData = req.body;

            if (!problemData.problemType || !problemData.sessionId) {
                return res.status(400).json({ message: 'Problem type and sessionId are required' });
            }

            // Save the problem data in the database
            const newProblem = await models.Problem.create({
                problemType: problemData.problemType,
                sessionId: problemData.sessionId,
                problemDetails: problemData
            });

            console.log('Problem saved in Browse Problem Service:', newProblem);

            return res.status(200).json({ message: 'Problem saved successfully in Browse Problem Service' });
        });
    } catch (error) {
        console.error('Error saving problem in Browse Problem Service:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};

