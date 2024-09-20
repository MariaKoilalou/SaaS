const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const PROBLEMS_PER_PAGE = 7;

exports.show = async (req, res) => {
    const sessionId = req.body.sessionId;
    const newBalance = req.body.newBalance;
    console.log('show: Received request for sessionId:', sessionId);

    try {
        // Check if the session exists in the Session table
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });

        if (!sessionData) {
            console.log(`Session ${sessionId} not found, creating a new one.`);
            sessionData = await models.Session.create({
                sid: sessionId,
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24-hour expiration
                data: JSON.stringify({ balance: newBalance })
            });
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
    } catch (err) {
        console.error('Error fetching problems:', err);
        return res.status(500).json({ message: 'Internal server error.', type: 'error' });
    }
};

exports.getProblem = async (req, res) => {
    const sessionId = req.body.sessionId;
    const newBalance = req.body.newBalance;

    console.log('getProblem: Received request for sessionId:', sessionId);

    try {
        // Check if the session exists in the Session table
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });
        console.log('Session data found:', sessionData);

        // If session doesn't exist, create it
        if (!sessionData) {
            console.log(`Session ${sessionId} not found, creating a new one.`);
            sessionData = await models.Session.create({
                sid: sessionId,
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24-hour expiration
                data: JSON.stringify({ balance: newBalance })
            });
            console.log('New session created:', sessionData);
        }

        // Validate the incoming problem data
        const problemData = req.body;

        if (!problemData.problemType || !problemData.sessionId) {
            console.log('Invalid problemType or sessionId:', problemData);
            return res.status(400).json({ message: 'Problem type and sessionId are required' });
        }

        // Save the problem data in the database
        const newProblem = await models.Problem.create({
            problemType: problemData.problemType,
            sessionId: problemData.sessionId,
            problemDetails: problemData
        });

        console.log('Problem saved:', newProblem);

        return res.status(200).json({ message: 'Problem saved successfully' });

    } catch (error) {
        console.error('Error saving problem:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};



