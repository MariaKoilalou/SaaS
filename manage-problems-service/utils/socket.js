let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: "*", // Allow all origins, or specify your frontend URL
                methods: ["GET", "POST"]
            }
        });
        console.log('Socket.io initialized');
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
