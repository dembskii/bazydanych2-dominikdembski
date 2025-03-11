const {pool} = require('../config/db');


const getAllProducts = async (options = {}) => {
    try {
        let query = `
            SELECT id, name, description, price, 
                   category, stock_count AS "stockCount", 
                   brand, image_url AS "imageUrl", 
                   stock_count > 0 AS "isAvailable",
                   created_at AS "createdAt"
            FROM products
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        
        if (options.available !== undefined) {
            query += ` AND stock_count ${options.available ? '> 0' : '= 0'}`;
        }
        
        
        if (options.category) {
            queryParams.push(options.category);
            query += ` AND category = $${queryParams.length}`;
        }
        
        
        if (options.sort === 'price') {
            query += ` ORDER BY price ASC`;
        } else if (options.sort === '-price') {
            query += ` ORDER BY price DESC`;
        } else {
            query += ` ORDER BY id ASC`;
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
        const { name, category, description, price, stockCount, brand, imageUrl } = productData;
        
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
            stockCount || 0, 
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
        
        const existingProduct = await getProductById(id);
        if (!existingProduct) {
            return null;
        }
        
        
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        if (productData.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(productData.name);
        }
        
        if (productData.category !== undefined) {
            fields.push(`category = $${paramCount++}`);
            values.push(productData.category);
        }
        
        if (productData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(productData.description);
        }
        
        if (productData.price !== undefined) {
            fields.push(`price = $${paramCount++}`);
            values.push(productData.price);
        }
        
        if (productData.stockCount !== undefined) {
            fields.push(`stock_count = $${paramCount++}`);
            values.push(productData.stockCount);
        }
        
        if (productData.brand !== undefined) {
            fields.push(`brand = $${paramCount++}`);
            values.push(productData.brand);
        }
        
        if (productData.imageUrl !== undefined) {
            fields.push(`image_url = $${paramCount++}`);
            values.push(productData.imageUrl);
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

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};