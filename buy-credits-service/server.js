const app = require('./app'); // Import the Express app

const sequelize = require("./utils/database");
var initModels = require("./models/init-models");
var models = initModels(sequelize);

const port = process.env.PORT || 4003;

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
                    console.log(`Buy Credits Service running on port ${port}!`);
                });

            })
            .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));

