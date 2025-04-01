const { pool } = require('../config/db');
const Joi = require('joi');

const reviewSchema = Joi.object({
    product_id: Joi.number().integer().positive().required(),
    user_id: Joi.number().integer().positive().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow('', null)
});

const reviewModel = {
    async createReview(reviewData) {
        const { error, value } = reviewSchema.validate(reviewData);
        if (error) throw new Error(`Validation error: ${error.message}`);

        const query = `
            INSERT INTO reviews (product_id, user_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [
            value.product_id,
            value.user_id,
            value.rating,
            value.comment
        ]);
        return result.rows[0];
    },

    async getReviewsForProduct(productId) {
        const query = `
            SELECT r.*, u.username, u.first_name, u.last_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC
        `;
        const result = await pool.query(query, [productId]);
        return result.rows;
    },

    async updateReview(id, reviewData) {
        const { error, value } = reviewSchema.validate(reviewData);
        if (error) throw new Error(`Validation error: ${error.message}`);

        const query = `
            UPDATE reviews
            SET rating = $1, comment = $2
            WHERE id = $3 AND user_id = $4
            RETURNING *
        `;
        const result = await pool.query(query, [
            value.rating,
            value.comment,
            id,
            value.user_id
        ]);
        return result.rows[0];
    },

    async deleteReview(id, userId) {
        const query = `
            DELETE FROM reviews
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    }
};

module.exports = reviewModel;