
const { Sequelize } = require('sequelize');
require('dotenv').config();
// Database connection configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'techmarket',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'haslo123',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testConnection();

module.exports = sequelize;