const { pool } = require('../config/db');
const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().max(50).allow('', null),
    last_name: Joi.string().max(50).allow('', null),
    is_admin: Joi.boolean().default(false)
});

const userModel = {
    async createUser(userData) {
        const { error, value } = userSchema.validate(userData);
        if (error) throw new Error(`Validation error: ${error.message}`);

        const query = `
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, first_name, last_name, is_admin, created_at
        `;
        const result = await pool.query(query, [
            value.username,
            value.email,
            value.password, 
            value.first_name,
            value.last_name,
            value.is_admin
        ]);
        return result.rows[0];
    },

    async getUserById(id) {
        const query = `
            SELECT id, username, email, first_name, last_name, is_admin, created_at
            FROM users
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = userModel;