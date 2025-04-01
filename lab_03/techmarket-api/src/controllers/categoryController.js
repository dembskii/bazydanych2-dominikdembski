const { Category, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');

// Schema walidacji
const categorySchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Nazwa kategorii musi mieć co najmniej 2 znaki',
            'string.max': 'Nazwa kategorii nie może przekraczać 50 znaków',
            'any.required': 'Nazwa kategorii jest wymagana'
        }),
    description: Joi.string()
        .allow('')
        .allow(null)
        .max(500)
        .messages({
            'string.max': 'Opis nie może przekraczać 500 znaków'
        })
});

// Kontrolery jako osobne funkcje
const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            include: [{
                model: Product,
                as: 'products',
                attributes: ['id']
            }],
            attributes: {
                include: [
                    [
                        sequelize.fn('COUNT', sequelize.col('products.id')),
                        'productCount'
                    ]
                ]
            },
            group: ['Category.id']
        });

        res.json(categories);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            include: [{
                model: Product,
                as: 'products'
            }]
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching category',
            error: error.message
        });
    }
};

const createCategory = async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body, { 
            abortEarly: false 
        });

        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.details.map(err => err.message)
            });
        }

        const existingCategory = await Category.findOne({
            where: { name: value.name }
        });

        if (existingCategory) {
            return res.status(400).json({
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.create(value);
        res.status(201).json(category);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            message: 'Error creating category',
            error: error.message
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.details.map(err => err.message)
            });
        }

        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const existingCategory = await Category.findOne({
            where: { 
                name: value.name,
                id: { [Op.ne]: req.params.id }
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                message: 'Category with this name already exists'
            });
        }

        await category.update(value);
        res.json(category);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            message: 'Error updating category',
            error: error.message
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.destroy();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting category',
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};