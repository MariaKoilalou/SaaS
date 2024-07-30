const sequelize = require('../utils/database');
var initModels = require("../models/init-models");
var models = initModels(sequelize);

const PROBLEMS_PER_PAGE = 7;

exports.show = async (req, res) => {
    const page = parseInt(req.query.pageNumber) || 1;

    try {
        // Count the total number of problems
        const totalProblems = await models.Problem.count();

        if (totalProblems === 0) {
            return res.status(200).json({
                pagination: {
                    currentPage: page,
                    hasNextPage: false,
                    hasPrevPage: false,
                    nextPage: null,
                    prevPage: null,
                    lastPage: 1
                },
                totalProblems: totalProblems,
                problems: []
            });
        }

        const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE);
        if (page > totalPages) {
            return res.status(404).json({ message: 'This problems page does not exist.', type: 'error' });
        }

        // Fetch the problems for the current page
        const problems = await models.Problem.findAll({
            offset: (page - 1) * PROBLEMS_PER_PAGE,
            limit: PROBLEMS_PER_PAGE,
            order: [['dateCreated', 'ASC']]
        });

        // Log the retrieved problems for debugging
        console.log('Fetched problems:', problems);

        // Format the problems array
        const problemsArr = problems.map(problem => {
            console.log('Problem:', problem);  // Debug log for each problem
            return {
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
            };
        });

        // Respond with the paginated problems
        res.status(200).json({
            pagination: {
                currentPage: page,
                hasNextPage: PROBLEMS_PER_PAGE * page < totalProblems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: totalPages
            },
            totalProblems: totalProblems,
            problems: problemsArr
        });
    } catch (err) {
        console.error('Error fetching problems:', err);
        res.status(500).json({ message: 'Internal server error.', type: 'error' });
    }
};


