const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Credits', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        transactionDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        tableName: 'Credits',
        schema: process.env.DB_SCHEMA,
        timestamps: false,
        indexes: [{
            name: "Credits_pkey",
            unique: true,
            fields: [
                {name: "id"},
            ]
        },]
    });


};
