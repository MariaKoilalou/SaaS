const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

exports.layout = async (req, res) => {
    try {
        // Check if balance exists in the session, otherwise initialize it
        if (typeof req.session.balance === 'undefined') {
            req.session.balance = 0;
        }

        // Render the credits page, showing the current balance from the session
        res.render('credits.ejs', {
            pageTitle: "Your Credits",
            newBalance: req.session.balance,
            addedCredits: null,
            error: null
        });
    } catch (error) {
        console.error('Error loading credits page:', error.message);

        res.render('credits.ejs', {
            pageTitle: "Your Credits",
            newBalance: 0,
            addedCredits: null,
            error: "Failed to load the credits page. Please try again later."
        });
        res.redirect('/');

    }
};


// Buy credits and send session data to the buy credits microservice
exports.buyCredits = async (req, res) => {
    const creditsToBuy = req.body.credits;
    const url = `http://buy_credits_service:4002/buy`;

    console.log('buyCredits: Received request to buy credits:', creditsToBuy, 'Session ID:', req.session.id);

    // Validate the number of credits to buy
    if (!creditsToBuy || creditsToBuy <= 0) {
        console.error('buyCredits: Invalid number of credits:', creditsToBuy);
        return res.status(400).json({ message: 'Invalid number of credits.' });
    }

    try {
        const response = await axios.post(url, {
            credits: creditsToBuy,
            sessionId: req.session.id,
            currentBalance: req.session.balance
        });

        console.log('buyCredits: Response received from buy credits microservice:', response.data);

        req.session.balance = response.data.newBalance;

        console.log('buyCredits: Updated session balance:', req.session.balance);

        return res.render('credits.ejs', {
            pageTitle: "Your Credits",
            addedCredits: response.data.creditsAdded,
            newBalance: req.session.balance,
            error: null
        });

    } catch (error) {
        console.error('buyCredits: Error purchasing credits:', error.message);
        if (error.response) {
            console.error('buyCredits: Error response data:', error.response.data);
        }

        // Render the page with an error message
        return res.render('credits.ejs', {
            pageTitle: "Your Credits",
            newBalance: req.session.balance || 0, // Use session balance or 0 if error
            addedCredits: null,
            error: "Failed to purchase credits. Please try again later."
        });
    }
};
