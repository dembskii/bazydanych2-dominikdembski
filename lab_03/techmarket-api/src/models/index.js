const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const Category = require('./Category');
const Product = require('./Product');
const Review = require('./Review');
const User = require('./User');

// Define associations
Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
});

Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
});

Product.hasMany(Review, {
    foreignKey: 'product_id',
    as: 'reviews'
});

Review.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

User.hasMany(Review, {
    foreignKey: 'user_id',
    as: 'reviews'
});

Review.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

module.exports = {
    sequelize,
    Category,
    Product,
    Review,
    User
};