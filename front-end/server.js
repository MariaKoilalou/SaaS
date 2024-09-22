const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const sequelize = require("./utils/database");
const initModels = require("./models/init-models");

// Initialize models
const models = initModels(sequelize);

const port = process.env.PORT || 4007;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Database and schema setup
sequelize
    .query(`CREATE SCHEMA IF NOT EXISTS "${process.env.DB_SCHEMA}";`)
    .then(() => {
        sequelize
            .sync({
                force: false, // Set this to `true` only for development, not in production
            })
            .then((result) => {
                // Start the HTTP server on the specified port
                server.listen(port, () => {
                    console.log(`Front-end Service running on port ${port}!`);
                });
            })
            .catch((err) => console.log('Error syncing Sequelize:', err));
    })
    .catch((err) => console.log('Error creating schema:', err));
