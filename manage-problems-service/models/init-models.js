const DataTypes = require("sequelize").DataTypes;
const _Problem = require("./Problem");
const _Execution = require("./Execution");
const _Session = require("./Session");

function initModels(sequelize) {
    const Problem = _Problem(sequelize, DataTypes);
    const Execution = _Execution(sequelize, DataTypes);
    const Session = _Session(sequelize, DataTypes);

    // Define relationships
    Session.hasMany(Problem, {
        foreignKey: 'sessionId',
        as: 'problems'
    });
    Problem.belongsTo(Session, {
        foreignKey: 'sessionId',
        as: 'session'
    });
    Problem.hasMany(Execution, {
        foreignKey: 'problemId', // Ensure this key matches the one defined in your Executions model
        as: 'executions' // Optionally define an alias for easier access and clearer code
    });
    Execution.belongsTo(Problem, {
        foreignKey: 'problemId',
        as: 'problem' // Optionally define an alias for the reverse relationship
    });

    return {Session, Problem, Execution };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
