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
            allowNull: false,
            // Optionally add an index for sessionId if queries by sessionId are frequent
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),  // Using DECIMAL for currency values to ensure precision
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
        indexes: [
            {
                name: "Credits_pkey",
                unique: true,
                fields: ["id"],
            },
            {
                name: "idx_sessionId",  // Additional index for sessionId
                fields: ["sessionId"],
            },
        ]
    });
};

