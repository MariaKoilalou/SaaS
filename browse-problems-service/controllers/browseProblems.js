const sequelize = require('../utils/database');
var initModels = require("../models/init-models");
var models = initModels(sequelize);

const PROBLEMS_PER_PAGE = 7;

exports.show = async (req, res, next) => {
    const page = parseInt(req.query.pageNumber) || 1;

    try {
        const totalProblems = await models.Problems.count();
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

        if (page > Math.ceil(totalProblems / PROBLEMS_PER_PAGE)) {
            return res.status(404).json({ message: 'This problems page does not exist.', type: 'error' });
        }

        const problems = await models.Problems.findAll({
            offset: (page - 1) * PROBLEMS_PER_PAGE,
            limit: PROBLEMS_PER_PAGE,
            order: [['dateCreated', 'ASC']]
        });

        const problemsArr = problems.map(problem => ({
            id: problem.id,
            title: problem.title,
            description: problem.description,
            dateCreated: new Intl.DateTimeFormat('en-US', {
                hour: 'numeric', minute: 'numeric', day: 'numeric',
                month: 'long', year: 'numeric', weekday: 'long'
            })
        }));

        res.status(200).json({
            pagination: {
                currentPage: page,
                hasNextPage: PROBLEMS_PER_PAGE * page < totalProblems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(totalProblems / PROBLEMS_PER_PAGE)
            },
            totalProblems: totalProblems,
            problems: problemsArr
        });
    } catch (err) {
        console.error('Error fetching problems:', err);
        res.status(500).json({ message: 'Internal server error.', type: 'error' });
    }
};



exports.status = (req, res, next) => {
    sequelize.authenticate()
        .then(() => res.status(200).json({ service: 'Browse Problems', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - OK' }))
        .catch(err => res.status(200).json({ service: 'Browse Problems', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - FAILED' }))
}