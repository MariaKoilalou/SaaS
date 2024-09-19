const DataTypes = require("sequelize").DataTypes;
const _Problem = require("./Problem");
const _Stats = require("./Stats");
const _Execution = require("./Execution");

function initModels(sequelize) {
    const Problem = _Problem(sequelize, DataTypes);
    const Stats = _Stats(sequelize, DataTypes);
    const Execution = _Execution(sequelize, DataTypes);


    // Define relationships
    Execution.hasOne(Stats, {
        foreignKey: 'executionId',
        as: 'execution'
    });
    Problem.hasMany(Execution, {
        foreignKey: 'problemId',
        as: 'stats'
    });
    Execution.belongsTo(Problem, {
        foreignKey: 'problemId',
        as: 'execution'
    });

    return { Problem, Stats, Execution };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
