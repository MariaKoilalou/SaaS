const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Problems', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },

    }, {
        sequelize,
        tableName: 'Problems',
        schema: process.env.DB_SCHEMA,
        timestamps: false,
        indexes: [{
            name: "Problems_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        }, ]
    });
};