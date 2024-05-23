var DataTypes = require("sequelize").DataTypes;
var _Credits = require("./Credits");

function initModels(sequelize) {
    var Credits = _Credits(sequelize, DataTypes);

    return { Credits };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;