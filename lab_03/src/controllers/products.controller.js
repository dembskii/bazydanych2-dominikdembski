import prisma from '../prismaClient.js';
import Joi from 'joi';


const productSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.base': 'Name must be a string.',
        'string.empty': 'Name cannot be empty.',
        'any.required': 'Name is required.'
    }),
    categoryId: Joi.number().integer().required().messages({
        'number.base': 'Category must be a number.',
        'number.integer': 'Category must be an integer.',
        'any.required': 'Category is required.'
    }),
    description: Joi.string().optional().messages({
        'string.base': 'Description must be a string.',
        'string.empty': 'Description cannot be empty.'
    }),
    price: Joi.number().required().messages({
        'number.base': 'Price must be a number.',
        'any.required': 'Price is required.'
    }),
    stockCount: Joi.number().integer().required().messages({
        'number.base': 'Stock count must be a number.',
        'number.integer': 'Stock count must be an integer.',
        'any.required': 'Stock count is required.'
    }),
    brand: Joi.string().required().messages({
        'string.base': 'Brand must be a string.',
        'string.empty': 'Brand cannot be empty.',
        'any.required': 'Brand is required.'
    }),
    imageUrl: Joi.string().optional().messages({
        'string.base': 'Image URL must be a string.',
        'string.empty': 'Image URL cannot be empty.'
    }),
    isAvailable: Joi.boolean().optional().messages({
        'boolean.base': 'IsAvailable must be a boolean value.'
    })
});


const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSortedProducts = async (req, res) => {
    try {
        const { column } = req.query;
        const validColumns = ['price'];
        if (!validColumns.includes(column)) {
            throw new Error(`Invalid column for sorting: ${column}. Valid columns are: ${validColumns.join(', ')}`);
        }
        const products = await prisma.product.findMany({
            orderBy: {
                [column]: 'asc',
            },
        });
        res.json(products);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAvailableProducts = async (req, res) => {
    try {
        const { isAvailable } = req.query;

        if (isAvailable !== 'true' && isAvailable !== 'false') {
            return res.status(400).json({
                message: "Query parameter 'isAvailable' is required and must be either 'true' or 'false'."
            });
        }

        const products = await prisma.product.findMany({
            where: {
                isAvailable: isAvailable === 'true',
            },
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductWithCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true },
        });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addProduct = async (req, res) => {
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { name, categoryId, description, price, stockCount, brand, imageUrl, isAvailable } = req.body;
        const newProduct = await prisma.product.create({
            data: {
                name,
                categoryId,
                description,
                price,
                stockCount,
                brand,
                imageUrl,
                isAvailable,
            },
        });
        res.json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = productSchema.validate(req.body, { allowUnknown: true, presence: 'optional' });
        if (error) {
            // Zwróć wiadomość błędu z walidatora Joi
            return res.status(400).json({ message: error.details[0].message });
        }

        const fields = { ...req.body };

        // Jeśli `category` jest przekazane, przekształć je na obiekt relacyjny
        if (fields.category) {
            fields.category = { connect: { id: fields.category } };
        }

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: fields,
        });

        res.json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await prisma.product.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAllProducts,
    getSortedProducts,
    getAvailableProducts,
    getProductById,
    getProductWithCategory,
    addProduct,
    updateProduct,
    deleteProduct
};