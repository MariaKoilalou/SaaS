const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const sequelize = require("./utils/database");
const initModels = require("./models/init-models");
const { consumeMessages } = require('./utils/rabbitmq/consumer'); // Import RabbitMQ consumer logic
const { sendMessageToQueue } = require('./utils/rabbitmq/publisher'); // Import RabbitMQ publisher logic

// Initialize models
const models = initModels(sequelize);

const port = process.env.PORT || 4004;

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
                // Start consuming RabbitMQ messages
                consumeMessages();  // Start consuming messages right when the service starts

                // Start the HTTP server on the specified port
                server.listen(port, () => {
                    console.log(`Manage Problems Service running on port ${port}!`);
                });
            })
            .catch((err) => console.log('Error syncing Sequelize:', err));
    })
    .catch((err) => console.log('Error creating schema:', err));

function handleMessage(message) {
    console.log('Received message:', message);

    if (message.action === 'execution_completed') {
        console.log(`Execution ${message.executionId} completed with result: ${message.result}`);
        // Handle execution completion, update database, notify other services, etc.
    } else if (message.action === 'execution_failed') {
        console.log(`Execution ${message.executionId} failed with error: ${message.error}`);
        // Handle execution failure, update status, notify other services, etc.
    } else {
        console.log(`Unhandled message action: ${message.action}`);
    }
}
