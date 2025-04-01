const { pool } = require('../config/db');
const Joi = require('joi');

const categorySchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    description: Joi.string().allow('', null)
});

const categoryModel = {
    async getAllCategories() {
        const query = `
            SELECT id, name, description, created_at AS "createdAt"
            FROM categories
            ORDER BY name
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async getCategoryById(id) {
        const query = `
            SELECT id, name, description, created_at AS "createdAt"
            FROM categories
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    },

    async createCategory(data) {
        const { error, value } = categorySchema.validate(data);
        if (error) throw new Error(`Validation error: ${error.message}`);

        const query = `
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            RETURNING id, name, description, created_at AS "createdAt"
        `;
        const result = await pool.query(query, [value.name, value.description]);
        return result.rows[0];
    },

    async updateCategory(id, data) {
        const { error, value } = categorySchema.validate(data);
        if (error) throw new Error(`Validation error: ${error.message}`);

        const query = `
            UPDATE categories
            SET name = $1, description = $2
            WHERE id = $3
            RETURNING id, name, description, created_at AS "createdAt"
        `;
        const result = await pool.query(query, [value.name, value.description, id]);
        return result.rows[0] || null;
    },

    async deleteCategory(id) {
        const query = `
            DELETE FROM categories
            WHERE id = $1
            RETURNING id, name, description, created_at AS "createdAt"
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }
};

module.exports = categoryModel;