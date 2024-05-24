const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database');  // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.buyCredits = async (req, res) => {
    const url = `http://${process.env.BASE_URL}:4002/buy`; // Assuming BASE_URL is set to the service host
    const amount = req.body.amount; // Amount to buy from the form input

    try {
        const response = await axios.post(url, { amount }, {
            headers: {
                "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES)),
                "Content-Type": "application/json"
            }
        });

        // Update or retrieve session information
        let userSession = await models.Session.find(req.session.id);
        if (!userSession) {
            userSession = new models.Session({id: req.session.id, credits: 0}); // Initialize with default credits if not found
        }
        // Assuming the service returns the new credit balance
        userSession.data.credits = response.data.balance;
        await userSession.update();

        // Render page with confirmation and credit balance
        res.render('credits.ejs', {
            pageTitle: "Credits Purchased",
            message: response.data.message,
            credits: userSession.data.credits
        });
    } catch (error) {
        console.error('Error purchasing credits:', error.message);

        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = new models.Session({id: req.session.id});
        }
        userSession.data.error = 'Failed to purchase credits. Please try again later.';
        await userSession.update();

        req.flash('error', userSession.data.error); // Use flash to show the error message
        res.redirect('/credits/buy'); // Redirect to the buy credits page on error
    }
};
