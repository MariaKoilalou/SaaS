const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Stats', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        problemId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        submissionsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        successfulSubmissions: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        failureSubmissions: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        tableName: 'Stats',
        schema: process.env.DB_SCHEMA,
        timestamps: false,
        indexes: [{
            name: "Stats_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        }, ]
    });
};
