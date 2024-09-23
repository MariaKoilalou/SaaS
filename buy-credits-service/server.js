const app = require('./app'); // Import the Express app

const sequelize = require("./utils/database");
const initModels = require("./models/init-models");
const models = initModels(sequelize);

const port = process.env.PORT || 4002;

sequelize
    .query(`CREATE SCHEMA IF NOT EXISTS "${process.env.DB_SCHEMA}";`)
    .then(() => {
        sequelize
            .sync({
                force: true,
            })
            .then((result) => {
                app.listen(port, () => {
                    console.log(`Buy Credits Service running on port ${port}!`);
                });

            })
            .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));

