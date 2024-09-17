const DataTypes = require("sequelize").DataTypes;
const _Problem = require("./Problem");
const _Execution = require("./Execution");

function initModels(sequelize) {
    const Problem = _Problem(sequelize, DataTypes);
    const Execution = _Execution(sequelize, DataTypes);

    // Define relationships
    Problem.hasMany(Execution, {
        foreignKey: 'problemId', // Ensure this key matches the one defined in your Executions model
        as: 'executions' // Optionally define an alias for easier access and clearer code
    });
    Execution.belongsTo(Problem, {
        foreignKey: 'problemId',
        as: 'problem' // Optionally define an alias for the reverse relationship
    });

    return { Problem, Execution };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
