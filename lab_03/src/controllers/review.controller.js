import prisma from '../prismaClient.js';
import Joi from 'joi';

const reviewSchema = Joi.object({
    productId: Joi.number().integer().required().messages({
        'number.base': 'Product ID must be a number.',
        'number.integer': 'Product ID must be an integer.',
        'any.required': 'Product ID is required.'
    }),
    userId: Joi.number().integer().required().messages({
        'number.base': 'User ID must be a number.',
        'number.integer': 'User ID must be an integer.',
        'any.required': 'User ID is required.'
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Rating must be a number.',
        'number.integer': 'Rating must be an integer.',
        'number.min': 'Rating must be at least 1.',
        'number.max': 'Rating must be at most 5.',
        'any.required': 'Rating is required.'
    }),
    comment: Joi.string().optional().messages({
        'string.base': 'Comment must be a string.',
        'string.empty': 'Comment cannot be empty.'
    })
});

const getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.findUnique({
            where: { id: parseInt(id) },
        });
        if (review) {
            res.json(review);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReviewsByProductId = async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await prisma.review.findMany({
            where: { productId: parseInt(id) },
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addReview = async (req, res) => {
    try {
        const { error } = reviewSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { productId, userId, rating, comment } = req.body;
        const newReview = await prisma.review.create({
            data: {
                productId,
                userId,
                rating,
                comment,
            },
        });
        res.json({ message: 'Review added successfully', review: newReview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = reviewSchema.validate(req.body, { allowUnknown: true, presence: 'optional' });
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const fields = req.body;
        const updatedReview = await prisma.review.update({
            where: { id: parseInt(id) },
            data: fields,
        });
        res.json({ message: 'Review updated successfully', review: updatedReview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReview = await prisma.review.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Review deleted successfully', review: deletedReview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAllReviews,
    getReviewById,
    getReviewsByProductId,
    addReview,
    updateReview,
    deleteReview
};