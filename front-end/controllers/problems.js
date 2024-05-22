const axios = require('axios');
const encrypt = require('../utils/encrypt');

exports.submitProblem = (req, res, next) => {

    const url_createQuestion = `http://${process.env.BASE_URL}:4001/create`;

    const headers = {
        "CUSTOM-SERVICES-HEADER": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    const data = {
    };

    const config_submitProblem = { method: 'post', url: url_createQuestion, data: data, headers: headers };

    let insertKeywords = new Promise((resolve, reject) => {
        axios(config_submitProblem)
            .then(result => {
                /* Successful creation of a question, show message */
                req.flash('messages', { type: result.data.type, value: result.data.message })
                resolve();
            })
            .catch(err => {
                /* Service Unavailable */
                if (err.code === 'ECONNREFUSED') {
                    isOK = false;
                    req.flash('messages', { type: 'error', value: 'The service is down. Please try again later.' })
                }
                else if (err.response.data.message === 'Validation Error!') {
                    err.response.data.errors.forEach(error => req.flash('messages', {type: error.type, value: `${error.msg}`}));
                    return res.redirect(req.headers.referer);
                }
                else {
                    req.flash('messages', { type: err.response.data.type, value: err.response.data.message })
                }
                resolve();
            });
    });

    insertKeywords.then(() => res.redirect(req.headers.referer));
}

exports.browseProblems = (req, res, next) => {

    const serviceDownMessages = req.session.messages || [];
    if (!req.session.messages) req.session.messages = [];

    if (serviceDownMessages.length !== 0) req.session.messages = [];

    let isOK = true, notExist = false, problems, totalProblems, pagination;

    const url_browseProblems = `http://${process.env.BASE_URL}:4003/show`;

    const page = +req.query.page || 1;

    const headers = {
        "CUSTOM-SERVICES-HEADER": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    const config_browseProblems = { method: 'post', url: url_browseProblems, headers: headers, data: { pageNumber: page } };

    let browseProblemsPromise = new Promise((resolve, reject) => {

        axios(config_browseProblems)
            /* if result status < 400 */
            .then(result => {
                problems = result.data.problems;
                totalProblems = result.data.totalProblems;
                pagination = result.data.pagination;
                resolve();
            })
            .catch(err => {
                if (err.code === 'ECONNREFUSED') {
                    isOK = false;
                    req.session.messages = [{ type: 'error', value: 'The service is down. Please try again later.' }];
                }
                else {
                    /* if page does not exist */
                    if (err.response.status === 404) notExist = true;
                    else isOK = false;
                    req.session.messages = [{ type: err.response.data.type, value: err.response.data.message }];
                }
                resolve();
            });

    });

    browseProblemsPromise.then(() => {

        let messages = req.flash("messages");

        messages = serviceDownMessages.length !== 0 ? messages.concat(serviceDownMessages) : messages;

        if (messages.length == 0) messages = [];

        if (!isOK) return res.redirect(req.headers.referer);
        else if (notExist) return res.redirect('/problems/show?page=1');

        res.render('show_problems.ejs', {
            pageTitle: "Browse Problems Page",
            questions: problems,
            totalQuestions: totalProblems,
            currentPage: pagination.currentPage,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            nextPage: pagination.nextPage,
            prevPage: pagination.prevPage,
            lastPage: pagination.lastPage,
            messages: messages,
            base_url: process.env.BASE_URL
        });
    });
};

exports.showProblem = (req, res, next) => {

    const serviceDownMessages = req.session.messages || [];
    if (!req.session.messages) req.session.messages = [];

    if (serviceDownMessages.length !== 0) req.session.messages = [];

    let problem, pagination, isOK = true, notExist = false;

    const url_browseQuestion = `http://${process.env.BASE_URL}:4002/problems/` + req.params.id;
    const page = +req.query.page || 1;

    const headers = {
        "CUSTOM-SERVICES-HEADER": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    const config_showProblem = { method: 'post', url: url_showProblem, headers: headers, data: { pageNumber: page } };

    let showProblemPromise = new Promise((resolve, reject) => {

        axios(config_showProblem)
            .then(result => {
                problem = result.data.problem;
                pagination = result.data.pagination;
                resolve();
            })
            .catch(err => {
                if (err.code === 'ECONNREFUSED') {
                    isOK = false;
                    req.session.messages = [{ type: 'error', value: 'The service is down. Please try again later.' }];
                }
                else {
                    /* this page does not exist */
                    if (err.response.status === 404) notExist = true;
                    else isOK = false;
                    req.session.messages = [{ type: err.response.data.type, value: err.response.data.message }];
                }
                resolve();
            });

    });

    showProblemPromise.then(() => {

        let messages = req.flash("messages");

        messages = serviceDownMessages.length !== 0 ? messages.concat(serviceDownMessages) : messages;

        if (messages.length == 0) messages = [];

        if (!isOK) return res.redirect('/problems/show?page=1');

        if (notExist) return res.redirect('/problems/' + req.params.id)

        res.render('submission_details.ejs',
            {
                pageTitle: "Problem Details Page",
                problem: problem,
                currentPage: pagination.currentPage,
                hasNextPage: pagination.hasNextPage,
                hasPrevPage: pagination.hasPrevPage,
                nextPage: pagination.nextPage,
                prevPage: pagination.prevPage,
                lastPage: pagination.lastPage,
                messages: messages,
                base_url: process.env.BASE_URL
            });
    });
}

exports.resultsProblem = (req, res, next) => {

    let isOK = true;

    const page = +req.query.page || 1;

    const url_postAnswer = `http://${process.env.BASE_URL}:4002/results/` + req.params.id;

    const data = {
        problemID: req.params.id,
        results: req.body.results
    };

    const headers = {
        "CUSTOM-SERVICES-HEADER": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))
    };

    const config_postResults = { method: 'post', url: url_postResults, headers: headers, data: data };

    /* Axios request to post an answer */
    let resultsProblemPromise = new Promise((resolve, reject) => {

        axios(config_postResults)
            .then(result => {
                req.flash('messages', { type: result.data.type, value: result.data.message });
                resolve();
            })
            .catch(err => {
                if (err.code === 'ECONNREFUSED') {
                    isOK = false;
                    req.flash('messages', { type: 'error', value: 'The service is down. Please try again later.' });
                }

                else req.flash('messages', { type: err.response.data.type, value: err.response.data.message });

                resolve();
            });
    });

    resultsProblemPromise.then( () => {

        if (!isOK) return res.redirect('/problems/show?page=1');
        res.redirect('/problems/' + req.params.id + '?page=' + page) ;
    });
}