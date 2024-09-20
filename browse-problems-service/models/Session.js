module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Session', {
        sid: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
        },
        expire: {
            type: DataTypes.DATE,
            allowNull: true
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawData = this.getDataValue('data');
                // Initialize session data with a balance of 0 if it doesn't exist
                const parsedData = rawData ? JSON.parse(rawData) : {};
                if (!parsedData.balance) {
                    parsedData.balance = 0; // Default balance
                }
                return parsedData;
            },
            set(value) {
                this.setDataValue('data', JSON.stringify(value)); // Convert JSON to text when saving
            }
        }
    }, {
        sequelize,
        tableName: 'Session',
        schema: process.env.DB_SCHEMA,
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

