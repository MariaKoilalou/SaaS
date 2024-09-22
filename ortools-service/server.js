const http = require('http'); // Import the HTTP module
const app = require('./app'); // Import the Express app
const socket = require('./utils/socket'); // Import socket utility

// Set the port using the PORT environment variable if available, or use 4008 as a fallback
const port = process.env.PORT || 4008;

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO using the socket utility and attach it to the server
const io = socket.init(server);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Add more event handlers if needed for OR-Tools related updates
});

// Start the HTTP server and Socket.IO
server.listen(port, () => {
    console.log(`OR-Tools Service running on port ${port}!`);
});
