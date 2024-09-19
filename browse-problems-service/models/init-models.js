const DataTypes = require("sequelize").DataTypes;
const _Problem = require("./Problem");
const _Session = require("./Session");

function initModels(sequelize) {
    const Session = _Session(sequelize, DataTypes);
    const Problem = _Problem(sequelize, DataTypes);

    Session.hasMany(Problem, {
        foreignKey: 'sessionId',
        as: 'problems'
    });
    Problem.belongsTo(Session, {
        foreignKey: 'sessionId',
        as: 'session'
    });

    return { Problem, Session };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;