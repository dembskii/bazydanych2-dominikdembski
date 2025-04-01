import prisma from '../prismaClient.js';
import Joi from 'joi';

const userSchema = Joi.object({
    username: Joi.string().required().messages({
        'string.base': 'Username must be a string.',
        'string.empty': 'Username cannot be empty.',
        'any.required': 'Username is required.'
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email must be a string.',
        'string.email': 'Email must be a valid email address.',
        'string.empty': 'Email cannot be empty.',
        'any.required': 'Email is required.'
    }),
    passwordHash: Joi.string().required().messages({
        'string.base': 'Password must be a string.',
        'string.empty': 'Password cannot be empty.',
        'any.required': 'Password is required.'
    }),
    firstName: Joi.string().optional().messages({
        'string.base': 'First name must be a string.',
        'string.empty': 'First name cannot be empty.'
    }),
    lastName: Joi.string().optional().messages({
        'string.base': 'Last name must be a string.',
        'string.empty': 'Last name cannot be empty.'
    })
});

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserWithReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { reviews: true },
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addUser = async (req, res) => {
    try {
        const { error } = userSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false,
                message: error.details[0].message 
            });
        }

        const { username, email, passwordHash, firstName, lastName } = req.body;

        // Check if the email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'A user with this email already exists' 
            });
        }

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
            },
        });

        res.json({ 
            success: true,
            message: 'User added successfully', 
            user: newUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = userSchema.validate(req.body, { allowUnknown: true, presence: 'optional' });
        if (error) {
            return res.status(400).json({ 
                success: false,
                message: error.details[0].message 
            });
        }
        const fields = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: fields,
        });
        res.json({ 
            success: true,
            message: 'User updated successfully', 
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getAllUsers,
    getUserById,
    getUserWithReviews,
    addUser,
    updateUser,
    deleteUser
};