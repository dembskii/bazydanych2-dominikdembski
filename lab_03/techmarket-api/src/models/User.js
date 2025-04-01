const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt'); 

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 50]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.VIRTUAL,
        allowNull: false,
        validate: {
            len: [6, 100]
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password_hash = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.password) {
                user.password_hash = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

module.exports = User;