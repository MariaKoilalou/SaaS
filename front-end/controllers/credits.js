const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.buyCredits = async (req, res) => {
    const url = `http://${process.env.BASE_URL}:4002/buy`; // Assuming BASE_URL is set to the service host

    try {
        const response = await axios.post(url, { amount }, {
            headers: {
                "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES)),
            }
        });

        // Retrieve or initialize session information
        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = await models.Session.create({sid: req.session.id, data: JSON.stringify({credits: 0})});
        }

        // Parse existing session data
        const sessionData = JSON.parse(userSession.data || '{}');
        sessionData.credits = response.data.balance; // Update credits balance

        // Save updated session data
        userSession.data = JSON.stringify(sessionData);
        await userSession.save();

        // Render page with confirmation and credit balance
        res.render('credits.ejs', {
            pageTitle: "Credits Purchased",
            message: response.data.message,
            credits: sessionData.credits // Display updated credits balance
        });
    } catch (error) {
        console.error('Error purchasing credits:', error.message);

        // Initialize error session if it does not exist
        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = await models.Session.create({sid: req.session.id, data: '{}'});
        }

        // Update session with error message
        const sessionData = JSON.parse(userSession.data || '{}');
        sessionData.error = 'Failed to purchase credits. Please try again later.';
        userSession.data = JSON.stringify(sessionData);
        await userSession.save();

        req.flash('error', sessionData.error); // Use flash to show the error message
        res.redirect('/credits/buy'); // Redirect to the buy credits page on error
    }
};
