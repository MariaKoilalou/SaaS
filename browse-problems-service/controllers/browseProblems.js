const axios = require('axios');
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);

const PROBLEMS_PER_PAGE = 7;

exports.sendProblemsStats = async (req, res) => {
    try {

        const sessionId = req.sessionID;

        if (!sessionId) {
            return res.status(400).json({
                message: 'Session ID is missing'
            });
        }

        // Fetch problem IDs belonging to the specific sessionId from the database
        const problems = await models.Problem.findAll({
            where: { sessionId }, // Assuming there’s a sessionId column in the Problem model
            attributes: ['id']
        });

        const problemIds = problems.map(problem => problem.id);

        // Log the problem IDs to confirm
        console.log('Filtered Problem IDs for session:', sessionId, problemIds);

        if (!problemIds || problemIds.length === 0) {
            return res.status(404).json({
                message: 'No problems found for the given session ID'
            });
        }

        // Send the problem IDs to the problem stats service
        const response = await axios.post('http://problem_stats_service:4006/problems', {
            problemIds
        });

        // Assuming the response from the stats service contains useful statistics
        const statsResponse = response.data;

        // Log the stats response to confirm it was received correctly
        console.log('Stats Service Response:', statsResponse);

        // Send a success message along with the stats response back to the client
        res.status(200).json({
            message: 'Problem statistics successfully retrieved',
            stats: statsResponse // The response data from the stats service
        });

    } catch (error) {
        console.error('Error fetching problems or sending to stats service:', error);
        res.status(500).json({
            message: 'Failed to fetch problem IDs or send them to the stats service',
            error: error.message
        });
    }
};



exports.show = async (req, res) => {
    const sessionId = req.body.sessionId;
    const newBalance = req.body.newBalance;
    const currentPage = req.query.page || 1; // Get current page from query parameters or default to 1
    const offset = (currentPage - 1) * PROBLEMS_PER_PAGE; // Calculate offset for pagination

    console.log('show: Received request for sessionId:', sessionId);

    try {
        let sessionData = await models.Session.findOne({ where: { sid: sessionId } });

        if (!sessionData) {
            console.log(`Session ${sessionId} not found, creating a new one.`);
            sessionData = await models.Session.create({
                sid: sessionId,
                expire: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24-hour expiration
                data: JSON.stringify({ balance: newBalance })
            });
        }

        // Fetch total problem count for the session
        const totalProblems = await models.Problem.count({
            where: { sessionId: sessionId }
        });

        if (totalProblems === 0) {
            return res.status(200).json({
                pagination: {
                    totalProblems: 0,
                    totalPages: 1,
                    problemsPerPage: PROBLEMS_PER_PAGE,
                    currentPage: 1
                },
                problems: []
            });
        }

        const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE);

        // Fetch paginated problem data based on session
        const problems = await models.Problem.findAll({
            where: { sessionId: sessionId },
            offset: offset,
            limit: PROBLEMS_PER_PAGE,
            order: [['dateCreated', 'ASC']]
        });

        const problemsArr = problems.map(problem => ({
            id: problem.id,
            problemType: problem.problemType,
            problemDetails: problem.problemDetails,
            status: problem.status, // Assuming 'status' is a field in the Problem model
            dateCreated: new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
            }).format(new Date(problem.dateCreated))
        }));

        // Send the response with problems and pagination data
        return res.status(200).json({
            pagination: {
                totalProblems: totalProblems,
                totalPages: totalPages,
                problemsPerPage: PROBLEMS_PER_PAGE,
                currentPage: parseInt(currentPage, 10)
            },
            problems: problemsArr
        });

    } catch (err) {
        console.error('Error fetching problems:', err);
        return res.status(500).json({ message: 'Internal server error.', type: 'error' });
    }
};

// exports.updateProblem = async (req, res) => {
//     // const { status, progress, result } = req.body;
//     const problemId = req.params.problemId; // Extract problemId from URL parameters
//
//     try {
//         // Find the problem in the database
//         const problem = await models.Problem.findOne({ where: { id: problemId } });
//
//         if (!problem) {
//             return res.status(404).json({ message: 'Problem not found.' });
//         }
//
//         // Update the problem's status, progress, and result in the database
//         // await problem.update({
//         //     status: status,
//         //     progress: progress || null,
//         //     result: result || null
//         // });
//
//         console.log(`Problem ${problemId} updated successfully`);
//         return res.status(200).json({ message: `Problem ${problemId} updated successfully.` });
//
//     } catch (error) {
//         console.error(`Error updating problem ${problemId}:`, error.message);
//         return res.status(500).json({ message: 'Internal server error. Unable to update the problem.' });
//     }
// };


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

exports.deleteProblem = async (req, res) => {
    const problemId = req.params.problemId;

    try {
        const problem = await models.Problem.findOne({ where: { id: problemId } });

        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        await models.Problem.destroy({ where: { id: problemId } });

        console.log(`Problem ${problemId} deleted from Browse Problem Service.`);

        return res.status(200).json({ message: `Problem ${problemId} deleted successfully from Browse Problem Service.` });

    } catch (error) {
        console.error(`Error deleting problem ${problemId} from Browse Problem Service:`, error.message);
        return res.status(500).json({ message: 'Internal server error. Could not delete the problem.' });
    }
};

exports.getStatus = async (req, res) => {
    const sessionId = req.session.id; // Use the sessionId to filter problems

    try {
        // Fetch all problems for the session
        const problems = await models.Problem.findAll({
            where: { sessionId: sessionId },
        });

        // Send the problems as a JSON response
        return res.status(200).json({ problems });

    } catch (error) {
        console.error('Error fetching problem status updates:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to fetch problem updates.' });
    }
};

