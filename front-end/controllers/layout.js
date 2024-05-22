
exports.getLanding = (req, res, next) => {

    let isOK = true;

    const serviceDownMessages = req.session.messages || [];
    if (!req.session.messages) req.session.messages = [];
    if (serviceDownMessages.length !== 0) req.session.messages = [];


    Promise.all([]).then(() => {

        let messages = req.flash("messages");

        messages = serviceDownMessages.length !== 0 ? messages.concat(serviceDownMessages) : messages;

        if (messages.length === 0) messages = [];

        res.render('home.html', {
            pageTitle: "Home Page",
            serviceUp: isOK,
            messages: messages,
            base_url: process.env.BASE_URL
        })

    })
}

