const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const { consumeMessages } = require('./utils/rabbitmq/consumer'); // Import RabbitMQ consumer logic
const { sendMessageToQueue } = require('./utils/rabbitmq/publisher'); // Import RabbitMQ publisher logic

const port = process.env.PORT || 4008;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Database and schema setup (if needed)

// Start consuming RabbitMQ messages
consumeMessages('vrp_solver_queue', handleSolverMessages);

// Start the HTTP server
server.listen(port, () => {
    console.log(`OR-Tools Service running on port ${port}!`);
});

// Function to handle incoming messages (trigger the solver based on the message)
function handleSolverMessages(message) {
    console.log('Received message:', message);

    if (message.action === 'start_vrp_solver') {
        // Trigger the VRP solver here with the message's details
        console.log('Starting VRP solver for problem:', message.problemId);
        // Call the controller function to start solving the problem
        // Alternatively, trigger a job to process the problem asynchronously
    } else {
        console.log('Unknown message action:', message.action);
    }
}
