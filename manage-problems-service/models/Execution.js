const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Execution', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        problemId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Problem',
                key: 'id'
            },
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('pending', 'started', 'completed', 'failed', 'cancelled', 'in-progress'),
            defaultValue: 'pending'
        },
        result: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metaData: {
            type: DataTypes.JSON,
            allowNull: true
        },
        inputData: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        sequelize,
        tableName: 'Execution',
        schema: process.env.DB_SCHEMA,
        timestamps: false,
        indexes: [{
            name: "Execution_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        }]
    });
};
