const app = require('./app'); // Import the Express app

// Set the port using the PORT environment variable if available, or use 8080 as a fallback
const port = process.env.PORT || 4001;

app.listen(port, () => {
    console.log(`Submit Problem Service running on port ${port}!`);
});