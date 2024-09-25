const app = require('./app'); // Import the Express app

const port = process.env.PORT || 4005;

app.listen(port, () => {
    console.log(`Statistics Service running on port ${port}!`);
});
