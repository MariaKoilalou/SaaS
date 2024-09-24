exports.getLanding = (req, res, next) => {
    // Ensure the session messages array is initialized properly
    if (!req.session.messages) {
        req.session.messages = [];
    }

    // Copy service down messages from the session, if any
    const serviceDownMessages = req.session.messages.slice();

    // Clear session messages after copying to avoid showing them again on refresh
    req.session.messages = [];

    // Now you can use these messages to status in the UI
    let messages = req.flash("messages");

    // Combine flash messages and service down messages
    messages = messages.concat(serviceDownMessages);

    res.render('home.ejs', {
        pageTitle: "Home Page",
        serviceUp: true, // Assuming service status should be dynamic or from some check
        messages: messages,
        base_url: process.env.BASE_URL
    });
}


