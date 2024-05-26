const axios = require('axios');
const encrypt = require('../utils/encrypt'); // Assuming encrypt is a utility function you've created
const sequelize = require('../utils/database'); // Assuming this exports a configured Sequelize instance
var initModels = require("../models/init-models");
var models = initModels(sequelize);

exports.checkCredits = async (req, res) => {
    const url = `http://${process.env.BASE_URL}:4002/check-credits`; // Adjusted endpoint for checking credits

    try {
        const response = await axios.get(url, {
            headers: {
                "Custom-Services-Header": JSON.stringify(encrypt(process.env.SECRET_STRING_SERVICES)),
            }
        });

        // Retrieve or initialize session information
        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = await models.Session.create({ sid: req.session.id, data: JSON.stringify({ credits: 0 }) });
        }

        // Parse existing session data
        const sessionData = JSON.parse(userSession.data || '{}');
        sessionData.credits = response.data.credits; // Assume the response includes a credits value

        // Save updated session data
        userSession.data = JSON.stringify(sessionData);
        await userSession.save();

        // Render page with current credit balance
        res.render('credits.ejs', {
            pageTitle: "Your Credits",
            credits: sessionData.credits // Display current credits balance
        });
    } catch (error) {
        console.error('Error checking credits:', error.message);

        // Handle error session initialization if it does not exist
        let userSession = await models.Session.findByPk(req.session.id);
        if (!userSession) {
            userSession = await models.Session.create({ sid: req.session.id, data: '{}' });
        }

        // Update session with error message
        const sessionData = JSON.parse(userSession.data || '{}');
        sessionData.error = 'Failed to check credits. Please try again later.';
        userSession.data = JSON.stringify(sessionData);
        await userSession.save();

        req.flash('error', sessionData.error); // Use flash to show the error message
        res.redirect('/'); // Redirect to a default or home page on error
    }
};
