var DataTypes = require("sequelize").DataTypes;
var _Problem = require("./Problem");

function initModels(sequelize) {
    var Problem = _Problem(sequelize, DataTypes);

    return { Problem };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;