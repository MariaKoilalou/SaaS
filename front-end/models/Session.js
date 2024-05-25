const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Session', {
        sid: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
        },
        expire: {
            type: DataTypes.ARRAY(DataTypes.DATE),
            allowNull: true
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawData = this.getDataValue('data');
                return rawData ? JSON.parse(rawData) : {}; // Parse the text back into JSON
            },
            set(value) {
                this.setDataValue('data', JSON.stringify(value)); // Convert JSON to text when saving
            }
        }
    }, {
        sequelize,
        tableName: 'Session',
        schema: process.env.DB_SCHEMA, // Ensure your DB schema is set correctly in environment variables
        timestamps: false,
        indexes: [
            {
                name: "Session_pkey",
                unique: true,
                fields: [
                    { name: "sid" },
                ]
            },
        ]
    });
};

