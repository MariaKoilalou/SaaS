var DataTypes = require("sequelize").DataTypes;
var _Problem = require("./Problem");
var _Session = require("./Session");

function initModels(sequelize) {
    var Session = _Session(sequelize, DataTypes);
    var Problem = _Problem(sequelize, DataTypes);

    return { Problem, Session };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;