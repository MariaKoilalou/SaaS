const DataTypes = require("sequelize").DataTypes;
const _Problems = require("./Problems");
const _Stats = require("./Stats");

function initModels(sequelize) {
    const Problems = _Problems(sequelize, DataTypes);
    const Stats = _Stats(sequelize, DataTypes);

    // Define relationships
    Problems.hasOne(Stats, {
        foreignKey: 'problemId', // Ensure this key matches the one defined in your Executions model
        as: 'stats' // Optionally define an alias for easier access and clearer code
    });
    Stats.belongsTo(Problems, {
        foreignKey: 'problemId',
        as: 'problem' // Optionally define an alias for the reverse relationship
    });

    return { Problems, Stats };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
