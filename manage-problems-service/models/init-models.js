const DataTypes = require("sequelize").DataTypes;
const _Problems = require("./Problems");
const _Executions = require("./Executions");

function initModels(sequelize) {
    const Problems = _Problems(sequelize, DataTypes);
    const Executions = _Executions(sequelize, DataTypes);

    // Define relationships
    Problems.hasMany(Executions, {
        foreignKey: 'problemId', // Ensure this key matches the one defined in your Executions model
        as: 'executions' // Optionally define an alias for easier access and clearer code
    });
    Executions.belongsTo(Problems, {
        foreignKey: 'problemId',
        as: 'problem' // Optionally define an alias for the reverse relationship
    });

    return { Problems, Executions };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
