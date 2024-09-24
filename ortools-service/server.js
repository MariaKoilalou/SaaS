const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const { sendMessageToQueue } = require('./utils/rabbitmq/publisher'); // Import RabbitMQ publisher logic

const port = process.env.PORT || 4008;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Start the HTTP server
server.listen(port, () => {
    console.log(`OR-Tools Service running on port ${port}!`);
});

