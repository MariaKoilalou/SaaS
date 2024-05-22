var DataTypes = require("sequelize").DataTypes;
var _Problems = require("./Problems");

function initModels(sequelize) {
    var Problems = _Problems(sequelize, DataTypes);

    return { Problems };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;