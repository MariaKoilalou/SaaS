const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Render the Buy Credits page (GET /credits)
exports.layout = async (req, res) => {
    try {
        // Check if balance exists in the session, otherwise initialize it
        if (typeof req.session.balance === 'undefined') {
            req.session.balance = 0; // Initialize balance if not set
        }

        // Render the credits page, showing the current balance from the session
        res.render('credits.ejs', {
            pageTitle: "Your Credits",
            newBalance: req.session.balance,  // The current balance from session
            addedCredits: null,               // No credits added yet
            error: null                       // No error initially
        });
    } catch (error) {
        console.error('Error loading credits page:', error.message);

        // If there's an error, render with an error message
        res.render('credits.ejs', {
            pageTitle: "Your Credits",
            newBalance: 0,
            addedCredits: null,
            error: "Failed to load the credits page. Please try again later."
        });
        res.redirect('/'); // Redirect the user to a default or error page

    }
};


// Buy credits and send session data to the buy credits microservice
exports.buyCredits = async (req, res) => {
    const creditsToBuy = req.body.credits; // Number of credits the user wants to buy
    const url = `http://buy_credits_service:4002/buy`;

    console.log('buyCredits: Received request to buy credits:', creditsToBuy, 'Session ID:', req.session.id);

    // Validate the number of credits to buy
    if (!creditsToBuy || creditsToBuy <= 0) {
        console.error('buyCredits: Invalid number of credits:', creditsToBuy);
        return res.status(400).json({ message: 'Invalid number of credits.' });
    }

    try {
        // Send POST request to the buy credits microservice with session ID and credits
        const response = await axios.post(url, {
            credits: creditsToBuy,           // Send the number of credits to add
            sessionId: req.session.id        // Include session ID in the request body
        });

        console.log('buyCredits: Response received from buy credits microservice:', response.data);

        // Update session balance
        req.session.balance = response.data.newBalance;

        console.log('buyCredits: Updated session balance:', req.session.balance);

        // Render the page with updated credit balance
        return res.render('credits.ejs', {
            pageTitle: "Your Credits",
            addedCredits: response.data.creditsAdded,
            newBalance: req.session.balance, // Updated balance from session
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
