const DataTypes = require("sequelize").DataTypes;
const _Session = require("./Session");
const _Problem = require("./Problem");
const _Execution = require("./Execution");
const _Stats = require("./Stats");

function initModels(sequelize) {
    const Session = _Session(sequelize, DataTypes);
    const Problem = _Problem(sequelize, DataTypes);
    const Execution = _Execution(sequelize, DataTypes);
    const Stats = _Stats(sequelize, DataTypes);


    // Define relationships
    Session.hasMany(Problem, {
        foreignKey: 'sessionId',
        as: 'problems'
    });
    Problem.belongsTo(Session, {
        foreignKey: 'sessionId',
        as: 'session'
    });
    Execution.hasOne(Stats, {
        foreignKey: 'executionId',
        as: 'stats'
    });
    Problem.hasMany(Execution, {
        foreignKey: 'problemId',
        as: 'executions'
    });
    Execution.belongsTo(Problem, {
        foreignKey: 'problemId',
        as: 'problem'
    });
    Stats.belongsTo(Execution, {
        foreignKey: 'executionId',
        as: 'execution'
    });

    return {Session, Problem, Stats, Execution };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
