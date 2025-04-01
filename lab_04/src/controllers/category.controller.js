import prisma from '../prismaClient.js';
import Joi from 'joi';


const categorySchema = Joi.object({
    name: Joi.string().required().messages({
        'string.base': 'Name must be a string.',
        'string.empty': 'Name cannot be empty.',
        'any.required': 'Name is required.'
    }),
    description: Joi.string().optional().messages({
        'string.base': 'Description must be a string.',
        'string.empty': 'Description cannot be empty.'
    })
});

const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
        });
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCategoryWithProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: { products: true },
        });
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addCategory = async (req, res) => {
    try {
        const { error } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { name, description } = req.body;
        const newCategory = await prisma.category.create({
            data: {
                name,
                description,
            },
        });
        res.json({ message: 'Category added successfully', category: newCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = categorySchema.validate(req.body, { allowUnknown: true, presence: 'optional' });
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const fields = req.body;
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: fields,
        });
        res.json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await prisma.category.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Category deleted successfully', category: deletedCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAllCategories,
    getCategoryById,
    getCategoryWithProducts,
    addCategory,
    updateCategory,
    deleteCategory,
};