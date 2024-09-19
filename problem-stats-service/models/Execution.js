const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Executions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        problemId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Problems',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('queued', 'running', 'completed', 'failed'),
            defaultValue: 'queued'
        },
        result: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        tableName: 'Executions',
        schema: process.env.DB_SCHEMA,
        timestamps: false,
        indexes: [{
            name: "Executions_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        }, ]
    });
};