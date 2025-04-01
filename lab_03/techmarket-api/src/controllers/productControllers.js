const { Product, Category, Review } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');

// Schema walidacji
const productSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Nazwa produktu musi mieć co najmniej 2 znaki',
            'string.max': 'Nazwa produktu nie może przekraczać 100 znaków',
            'any.required': 'Nazwa produktu jest wymagana'
        }),
    price: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Cena musi być liczbą',
            'number.positive': 'Cena musi być większa od zera',
            'any.required': 'Cena jest wymagana'
        }),
    description: Joi.string()
        .allow('')
        .allow(null)
        .max(1000)
        .messages({
            'string.max': 'Opis nie może przekraczać 1000 znaków'
        }),
    category_id: Joi.number()
        .integer()
        .allow(null)
        .messages({
            'number.base': 'ID kategorii musi być liczbą'
        }),
    stock_count: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .messages({
            'number.min': 'Stan magazynowy nie może być ujemny'
        })
});

const getProducts = async (req, res) => {
    try {
        const options = {
            include: [{
                model: Category,
                as: 'category'
            }],
            where: {}
        };

        if (req.query.category_id) {
            options.where.category_id = req.query.category_id;
        }

        if (req.query.available === 'true') {
            options.where.stock_count = { [Op.gt]: 0 };
        }

        const products = await Product.findAll(options);
        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas pobierania produktów',
            error: error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                {
                    model: Category,
                    as: 'category'
                },
                {
                    model: Review,
                    as: 'reviews',
                    include: ['user']
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Nie znaleziono produktu' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas pobierania produktu',
            error: error.message
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const { error, value } = productSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Błąd walidacji',
                errors: error.details.map(err => err.message)
            });
        }

        const product = await Product.create(value);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas tworzenia produktu',
            error: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { error, value } = productSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Błąd walidacji',
                errors: error.details.map(err => err.message)
            });
        }

        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Nie znaleziono produktu' });
        }

        await product.update(value);
        res.json(product);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas aktualizacji produktu',
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Nie znaleziono produktu' });
        }

        await product.destroy();
        res.json({ message: 'Produkt został usunięty' });
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas usuwania produktu',
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};