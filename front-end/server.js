const app = require('./app'); // Import the Express app

// Set the port using the PORT environment variable if available, or use 8080 as a fallback
const port = process.env.PORT || 4007;

const sequelize = require("./utils/database");
sequelize
    .query(`CREATE SCHEMA IF NOT EXISTS "${process.env.DB_SCHEMA}";`)
    .then(() => {
        sequelize
            .sync({
                // delete if system is ready to deploy
                force: true,
                // end
            })
            .then((result) => {
                app.listen(port, () => {
                    console.log(`Server running on port ${port}!`);
                });
            })
            .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));