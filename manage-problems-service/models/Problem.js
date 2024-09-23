const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Problem', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Session',
                key: 'sid'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        problemType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        problemDetails: {
            type: DataTypes.JSON, // Store problem data as JSON (to hold problem-specific fields)
            allowNull: false
        },
        dateCreated: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        sequelize,
        tableName: 'Problem',
        schema: process.env.DB_SCHEMA,
        timestamps: false,
        indexes: [
            {
                name: "Problem_pkey",
                unique: true,
                fields: ["id"]
            },
            {
                name: "idx_sessionId",  // Index for sessionId for faster lookups
                fields: ["sessionId"]
            },
        ]
    });
};

