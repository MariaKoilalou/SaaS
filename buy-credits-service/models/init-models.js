var DataTypes = require("sequelize").DataTypes;
var _Session = require("./Session");

function initModels(sequelize) {
    var Session = _Session(sequelize, DataTypes);

    return {
        Session,
    };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;