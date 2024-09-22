const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const sequelize = require("./utils/database");
const initModels = require("./models/init-models");
const socket = require('./utils/socket'); // Import socket utility

// Initialize models
const models = initModels(sequelize);

const port = process.env.PORT || 4004;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO using the socket utility and attach it to the server
const io = socket.init(server);

// Socket.IO connection handling (inside utils/socket.js)
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Add more event handlers if needed
});

// Database and schema setup
sequelize
    .query(`CREATE SCHEMA IF NOT EXISTS "${process.env.DB_SCHEMA}";`)
    .then(() => {
        sequelize
            .sync({
                // Delete this option if the system is ready to deploy
                force: false, // Set this to `true` only for development, not in production
            })
            .then((result) => {
                // Start the HTTP server with Socket.IO on the specified port
                server.listen(port, () => {
                    console.log(`Manage Problems Service running on port ${port}!`);
                });
            })
            .catch((err) => console.log('Error syncing Sequelize:', err));
    })
    .catch((err) => console.log('Error creating schema:', err));
