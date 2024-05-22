const sequelize = require('../utils/database');
var initModels = require("../models/init-models");
var models = initModels(sequelize);

const PROBLEMS_PER_PAGE = 7;

exports.show = (req, res, next) => {

    const page = req.body.pageNumber;

    let questionsArr = [], totalProblems;

    let browseProblemsPromise = new Promise((resolve, reject) => {

        models.Problems.count().then(numProblems => {
            totalProblems = numProblems;

            if (totalProblems == 0) return resolve();

            if (page > Math.ceil(totalProblems / PROBLEMS_PER_PAGE)) return res.status(404).json({ message: 'This problems page does not exist.', type: 'error' })

            return models.pROBLEMS.findAll({
                raw: true,
                offset: ((page - 1) * PROBLEMS_PER_PAGE),
                limit: PROBLEMS_PER_PAGE,
                order: [['dateCreated', 'ASC']]
            });
        })
            .then(rows => {

                if (!rows) return resolve();

                rows.forEach((row, index) => {

                    let problem = {};

                    dateOptions = { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };

                    problem.id = row.id;
                    problem.title = row.title;
                    problem.dateCreated = new Intl.DateTimeFormat('en-US', dateOptions).format(row.dateCreated);

                    problemsArr.push(problem);

                    if (index === problemsArr.length - 1) return resolve();
                })

                return resolve();
            })
            .catch(err => res.status(500).json({ message: 'Internal server error.', type: 'error' }));
    })


    /* when all data is retrieved from database send the json with status of 200 */
    Promise.all([browseProblemsPromise]).then(() => {

        return res.status(200).json({
            pagination: {
                currentPage: page,
                hasNextPage: PROBLEMS_PER_PAGE * page < totalProblems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(totalProblems / PROBLEMS_PER_PAGE)
            },
            totalQuestions: totalProblems,
            questions: problemsArr
        })
    })
        .catch(err => res.status(500).json({ message: 'Internal server error.', type: 'error' }))

}


exports.status = (req, res, next) => {
    sequelize.authenticate()
        .then(() => res.status(200).json({ service: 'Browse Problems', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - OK' }))
        .catch(err => res.status(200).json({ service: 'Browse Problems', status: 'UP', uptime: Math.floor(process.uptime()), database: 'Connection - FAILED' }))
}