const { Review, Product, User } = require('../models');
const Joi = require('joi');

const reviewSchema = Joi.object({
    product_id: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'ID produktu musi być liczbą',
            'any.required': 'ID produktu jest wymagane'
        }),
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
            'number.base': 'Ocena musi być liczbą',
            'number.min': 'Ocena musi być między 1 a 5',
            'number.max': 'Ocena musi być między 1 a 5',
            'any.required': 'Ocena jest wymagana'
        }),
    comment: Joi.string()
        .allow('')
        .allow(null)
        .max(1000)
        .messages({
            'string.max': 'Komentarz nie może przekraczać 1000 znaków'
        })
});

const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { product_id: req.params.productId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'first_name', 'last_name']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas pobierania recenzji',
            error: error.message
        });
    }
};

const createReview = async (req, res) => {
    try {
        const { error, value } = reviewSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Błąd walidacji',
                errors: error.details.map(err => err.message)
            });
        }

        const product = await Product.findByPk(value.product_id);
        
        if (!product) {
            return res.status(404).json({
                message: 'Nie znaleziono produktu'
            });
        }

        const review = await Review.create({
            ...value,
            user_id: req.user.id
        });

        res.status(201).json(review);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Już dodałeś recenzję tego produktu'
            });
        }

        res.status(500).json({
            message: 'Błąd podczas tworzenia recenzji',
            error: error.message
        });
    }
};

const updateReview = async (req, res) => {
    try {
        const { error, value } = reviewSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Błąd walidacji',
                errors: error.details.map(err => err.message)
            });
        }

        const review = await Review.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!review) {
            return res.status(404).json({ message: 'Nie znaleziono recenzji' });
        }

        await review.update(value);
        res.json(review);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas aktualizacji recenzji',
            error: error.message
        });
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!review) {
            return res.status(404).json({ message: 'Nie znaleziono recenzji' });
        }

        await review.destroy();
        res.json({ message: 'Recenzja została usunięta' });
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas usuwania recenzji',
            error: error.message
        });
    }
};

module.exports = {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview
};