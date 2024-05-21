const jwt_decode = require('jwt-decode');

exports.getHome = (req, res, next) => {

    // test
    let resultKeywords, resultQsPerDay, isOK = true;

    // get service down messages from sessions, because when redirecting messages cant be sent.
    const serviceDownMessages = req.session.messages || [];

    // in case req.session.messages is undefined
    if (!req.session.messages) req.session.messages = [];

    // in case req.session.messages has messages, we got them so we need to empty the req.session.messages
    if (serviceDownMessages.length !== 0) req.session.messages = [];

    /* Construct urls to get the graphs (Graphs Service -> 2 endpoints, 1 graph each) */
    const url_keywords = `http://${process.env.BASE_URL}:4005/topkeywords`;
    const url_qsperday = `http://${process.env.BASE_URL}:4005/qsperday`;

    /* Add necessary headers */
    const headers = {"CUSTOM-SERVICES-HEADER": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES))};
    exports.getHome = (req, res, next) => {

        let resultKeywords, resultQsPerDay, isOK = true;
        /* Create the configs for the requests */
        const config_keywords = {method: 'get', url: url_keywords, headers: headers};
        const config_qsperday = {method: 'get', url: url_qsperday, headers: headers};

        /* Axios request to get data from graphs service - questions per keyword data */
        let qsPerKeywordsDataPromise = new Promise((resolve, reject) => {
            axios(config_keywords)
                .then(result => {
                    resultKeywords = result;
                    resolve();
                })
                .catch(err => {
                    isOK = false;
                    resolve();
                });
        })

        /* Axios request to get data from graphs service - questions per day data */
        let qsPerDayPromise = new Promise((resolve, reject) => {
            axios(config_qsperday)
                .then(result => {
                    resultQsPerDay = result;
                    resolve();
                })
                .catch(err => {
                    isOK = false;
                    resolve();
                });
        })

        /* After all requests finished and data is now retrieved render the data */
        Promise.all([qsPerKeywordsDataPromise, qsPerDayPromise]).then(() => {

            let messages = req.flash("messages");

            messages = serviceDownMessages.length !== 0 ? messages.concat(serviceDownMessages) : messages;

            if (messages.length === 0) messages = [];

            res.render('home.ejs', {
                pageTitle: "Home Page",
                topKeywords: isOK ? resultKeywords.data.topKeywords : 0,
                topKeywordsFreq: isOK ? resultKeywords.data.topKeywordsFreq : 0,
                qsPerDayDates: isOK ? resultQsPerDay.data.qsPerDayDates : 0,
                qsPerDayFreq: isOK ? resultQsPerDay.data.qsPerDayFreq : 0,
                serviceUp: isOK,
                messages: messages,
                base_url: process.env.BASE_URL
            })

        })
    }
}
    exports.getAbout = (req, res, next) => {
        res.render('about.ejs', {
            pageTitle: "About Page",
            base_url: process.env.BASE_URL
        })
    }

    // exports.getDemo = (req, res, next) => {
    //     res.render('demo.ejs', {
    //         pageTitle: "Demo Page",
    //         base_url: process.env.BASE_URL
    //     })
    // }

    exports.getInstructions = (req, res, next) => {
        res.render('instructions.ejs', {
            pageTitle: "Contact Us Page",
            base_url: process.env.BASE_URL
        })
    }
