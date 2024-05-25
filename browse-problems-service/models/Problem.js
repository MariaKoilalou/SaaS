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
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        dateCreated: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        sequelize,
        tableName: 'Problem',
        timestamps: false,
        indexes: [
            {
                name: "Problem_pkey",
                unique: true,
                fields: ["id"]
            },
            {
                name: "idx_sessionId",  // Additional index for sessionId
                fields: ["sessionId"],
            },
        ]
    });
};
