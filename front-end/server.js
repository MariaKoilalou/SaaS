const app = require('./app'); // Import the Express app

// Set the port using the PORT environment variable if available, or use 8080 as a fallback
const port = process.env.PORT || 8080;

// Start listening for requests on the specified port
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}!`);
});