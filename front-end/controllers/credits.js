const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
const initModels = require("../models/init-models");
const models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

exports.layout = async (req, res) => {
    try {
        // URL of the buy_credits_service to get the session balance
        const url = `http://buy_credits_service:4002/balance`;

        let balance = 0;

        // Fetch the balance from the backend buy_credits_service
        try {
            const response = await axios.get(url, {
                params: {
                    sessionId: req.session.id
                }
            });

            balance = response.data.balance;
            console.log('Fetched balance from buy_credits_service:', balance);
        } catch (error) {
            console.error('Error fetching balance from buy_credits_service:', error.message);
            // If there's an error fetching balance, set it to 0
            balance = 0;
        }

        // Render the credits page with the fetched balance
        res.render('credits.ejs', {
            pageTitle: "Your Credits",
            newBalance: balance,
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



exports.buyCredits = async (req, res) => {
    const creditsToBuy = req.body.credits;
    const url = `http://buy_credits_service:4002/buy`;

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

        req.session.balance = response.data.newBalance;

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
