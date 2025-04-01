const {pool} = require('../config/db');
const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Nazwa produktu nie może być pusta',
            'string.min': 'Nazwa produktu musi mieć co najmniej {#limit} znaki',
            'string.max': 'Nazwa produktu nie może przekraczać {#limit} znaków',
            'any.required': 'Nazwa produktu jest wymagana'
        }),
    
    category_id: Joi.number().integer().positive().allow(null),

    description: Joi.string().allow('', null),
    
    price: Joi.number().precision(2).positive().required()
        .messages({
            'number.base': 'Cena musi być liczbą',
            'number.positive': 'Cena musi być większa od zera',
            'any.required': 'Cena jest wymagana'
        }),
    
    category: Joi.string().allow('', null).max(50)
        .messages({
            'string.max': 'Kategoria nie może przekraczać {#limit} znaków'
        }),
    
    stockCount: Joi.number().integer().min(0).default(0)
        .messages({
            'number.base': 'Ilość w magazynie musi być liczbą',
            'number.integer': 'Ilość w magazynie musi być liczbą całkowitą',
            'number.min': 'Ilość w magazynie nie może być ujemna'
        }),
    
    brand: Joi.string().allow('', null).max(50)
        .messages({
            'string.max': 'Marka nie może przekraczać {#limit} znaków'
        }),
    
    imageUrl: Joi.string().allow('', null).max(255).uri().messages({
        'string.uri': 'URL obrazka musi być poprawnym adresem URL',
        'string.max': 'URL obrazka nie może przekraczać {#limit} znaków'
    })
});

const updateProductSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100)
        .messages({
            'string.empty': 'Nazwa produktu nie może być pusta',
            'string.min': 'Nazwa produktu musi mieć co najmniej {#limit} znaki',
            'string.max': 'Nazwa produktu nie może przekraczać {#limit} znaków'
        }),
    
    description: Joi.string().allow('', null),
    
    price: Joi.number().precision(2).positive()
        .messages({
            'number.base': 'Cena musi być liczbą',
            'number.positive': 'Cena musi być większa od zera'
        }),
    
    category: Joi.string().allow('', null).max(50)
        .messages({
            'string.max': 'Kategoria nie może przekraczać {#limit} znaków'
        }),
    
    stockCount: Joi.number().integer().min(0)
        .messages({
            'number.base': 'Ilość w magazynie musi być liczbą',
            'number.integer': 'Ilość w magazynie musi być liczbą całkowitą',
            'number.min': 'Ilość w magazynie nie może być ujemna'
        }),
    
    brand: Joi.string().allow('', null).max(50)
        .messages({
            'string.max': 'Marka nie może przekraczać {#limit} znaków'
        }),
    
    imageUrl: Joi.string().allow('', null).max(255).uri().messages({
        'string.uri': 'URL obrazka musi być poprawnym adresem URL',
        'string.max': 'URL obrazka nie może przekraczać {#limit} znaków'
    })
});



const getAllProducts = async (options = {}) => {
    try {
        let query = `
            SELECT p.*, 
                   c.name AS category_name,
                   COALESCE(AVG(r.rating), 0) AS average_rating,
                   COUNT(DISTINCT r.id) AS review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        if (options.category_id) {
            queryParams.push(options.category_id);
            query += ` AND p.category_id = $${queryParams.length}`;
        }

        if (options.available !== undefined) {
            query += ` AND p.stock_count ${options.available ? '> 0' : '= 0'}`;
        }

        query += ` GROUP BY p.id, c.name`;

        if (options.sort === 'price') {
            query += ` ORDER BY p.price ASC`;
        } else if (options.sort === '-price') {
            query += ` ORDER BY p.price DESC`;
        } else if (options.sort === 'rating') {
            query += ` ORDER BY average_rating DESC`;
        } else {
            query += ` ORDER BY p.created_at DESC`;
        }
        
        const result = await pool.query(query, queryParams);
        return result.rows;
    } catch (error) {
        throw new Error(`Error fetching products: ${error.message}`);
    }
};


const getProductById = async (id) => {
    try {
        const query = `
            SELECT id, name, description, price, 
                   category, stock_count AS "stockCount", 
                   brand, image_url AS "imageUrl", 
                   stock_count > 0 AS "isAvailable",
                   created_at AS "createdAt"
            FROM products
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error fetching product: ${error.message}`);
    }
};


const createProduct = async (productData) => {
    try {

        const { error, value } = createProductSchema.validate(productData, { abortEarly: false });
        
        if (error) {
            const messages = error.details.map(detail => detail.message).join(', ');
            throw new Error(`Błąd walidacji: ${messages}`);
        }
        

        const { name, category, description, price, stockCount, brand, imageUrl } = value;
        
        const query = `
            INSERT INTO products (
                name, category, description, price, 
                stock_count, brand, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, category, description, price, 
                      stock_count AS "stockCount", brand, 
                      image_url AS "imageUrl",
                      stock_count > 0 AS "isAvailable",
                      created_at AS "createdAt"
        `;
        
        const values = [
            name, 
            category || null, 
            description || null, 
            price, 
            stockCount, 
            brand || null, 
            imageUrl || null
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error creating product: ${error.message}`);
    }
};


const updateProduct = async (id, productData) => {
    try {

        const { error, value } = updateProductSchema.validate(productData, { abortEarly: false });
        
        if (error) {
            const messages = error.details.map(detail => detail.message).join(', ');
            throw new Error(`Błąd walidacji: ${messages}`);
        }
        

        const existingProduct = await getProductById(id);
        if (!existingProduct) {
            return null;
        }
        

        const fields = [];
        const values = [];
        let paramCount = 1;
        
        if (value.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(value.name);
        }
        
        if (value.category !== undefined) {
            fields.push(`category = $${paramCount++}`);
            values.push(value.category);
        }
        
        if (value.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(value.description);
        }
        
        if (value.price !== undefined) {
            fields.push(`price = $${paramCount++}`);
            values.push(value.price);
        }
        
        if (value.stockCount !== undefined) {
            fields.push(`stock_count = $${paramCount++}`);
            values.push(value.stockCount);
        }
        
        if (value.brand !== undefined) {
            fields.push(`brand = $${paramCount++}`);
            values.push(value.brand);
        }
        
        if (value.imageUrl !== undefined) {
            fields.push(`image_url = $${paramCount++}`);
            values.push(value.imageUrl);
        }
        

        if (fields.length === 0) {
            return existingProduct;
        }
        
        values.push(id);
        
        const query = `
            UPDATE products
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, description, price, 
                     category, stock_count AS "stockCount", 
                     brand, image_url AS "imageUrl", 
                     stock_count > 0 AS "isAvailable",
                     created_at AS "createdAt"
        `;
        
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error updating product: ${error.message}`);
    }
};


const deleteProduct = async (id) => {
    try {
        const existingProduct = await getProductById(id);
        if (!existingProduct) {
            return null;
        }
        
        const query = `
            DELETE FROM products
            WHERE id = $1
            RETURNING id, name, description, price, 
                     category, stock_count AS "stockCount", 
                     brand, image_url AS "imageUrl", 
                     stock_count > 0 AS "isAvailable",
                     created_at AS "createdAt"
        `;
        
        const result = await pool.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error deleting product: ${error.message}`);
    }
};

const getProductWithReviews = async (id) => {
    try {
        const productQuery = `
            SELECT p.*, c.name AS category_name, 
                   AVG(r.rating) AS average_rating,
                   COUNT(r.id) AS review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.id = $1
            GROUP BY p.id, c.name
        `;
        const product = await pool.query(productQuery, [id]);
        
        if (product.rows.length === 0) {
            return null;
        }

        const reviewsQuery = `
            SELECT r.*, u.username, u.first_name, u.last_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviews = await pool.query(reviewsQuery, [id]);

        return {
            ...product.rows[0],
            reviews: reviews.rows
        };
    } catch (error) {
        throw new Error(`Error fetching product with reviews: ${error.message}`);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductWithReviews
};