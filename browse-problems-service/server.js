const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const sequelize = require("./utils/database");
const initModels = require("./models/init-models");
const { consumeMessages } = require('./utils/rabbitmq/consumer'); // Import RabbitMQ consumer

// Initialize models
const models = initModels(sequelize);

const port = process.env.PORT || 4003;

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
                // Start consuming RabbitMQ messages for problem updates
                consumeMessages('problem_updates_queue', handleProblemUpdate);

                // Start the HTTP server
                server.listen(port, () => {
                    console.log(`Browse Problems Service running on port ${port}!`);
                });
            })
            .catch((err) => console.log('Error syncing Sequelize:', err));
    })
    .catch((err) => console.log('Error creating schema:', err));

// Function to handle problem updates received from RabbitMQ
function handleProblemUpdate(message) {
    console.log('Received message from RabbitMQ:', message);

    if (message.action === 'solver_progress' || message.action === 'solver_completed' || message.action === 'solver_failed') {
        updateProblemStatus(message);
    } else {
        console.log('Unhandled message action:', message.action);
    }
}

// Function to update the problem status in the database
async function updateProblemStatus(message) {
    const { problemId, status, result, progress } = message;
    try {
        const problem = await models.Problem.findOne({ where: { id: problemId } });

        if (!problem) {
            console.log(`Problem with ID ${problemId} not found`);
            return;
        }

        // Update the problem's status and result
        await problem.update({
            status: status || problem.status,
            result: result || problem.result,
            progress: progress || problem.progress
        });

        console.log(`Problem ${problemId} updated successfully with status ${status}`);
    } catch (error) {
        console.error(`Error updating problem ${problemId}:`, error.message);
    }
}
