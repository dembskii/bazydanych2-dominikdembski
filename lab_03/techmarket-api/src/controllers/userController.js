const { User, Review } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// Schema walidacji dla użytkownika
const userSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.min': 'Nazwa użytkownika musi mieć co najmniej 3 znaki',
            'string.max': 'Nazwa użytkownika nie może przekraczać 50 znaków',
            'any.required': 'Nazwa użytkownika jest wymagana'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Nieprawidłowy format email',
            'any.required': 'Email jest wymagany'
        }),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Hasło musi mieć co najmniej 6 znaków',
            'any.required': 'Hasło jest wymagane'
        }),
    first_name: Joi.string()
        .allow('')
        .allow(null)
        .max(50)
        .messages({
            'string.max': 'Imię nie może przekraczać 50 znaków'
        }),
    last_name: Joi.string()
        .allow('')
        .allow(null)
        .max(50)
        .messages({
            'string.max': 'Nazwisko nie może przekraczać 50 znaków'
        })
});

const userUpdateSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(50)
        .messages({
            'string.min': 'Nazwa użytkownika musi mieć co najmniej 3 znaki',
            'string.max': 'Nazwa użytkownika nie może przekraczać 50 znaków'
        }),
    email: Joi.string()
        .email()
        .messages({
            'string.email': 'Nieprawidłowy format email'
        }),
    first_name: Joi.string()
        .allow('')
        .allow(null)
        .max(50)
        .messages({
            'string.max': 'Imię nie może przekraczać 50 znaków'
        }),
    last_name: Joi.string()
        .allow('')
        .allow(null)
        .max(50)
        .messages({
            'string.max': 'Nazwisko nie może przekraczać 50 znaków'
        })
}).min(1);

const createUser = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Błąd walidacji',
                errors: error.details.map(err => err.message)
            });
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: value.username },
                    { email: value.email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Użytkownik o takiej nazwie lub emailu już istnieje'
            });
        }

        // Hash the password before creating the user
        const hashedPassword = await bcrypt.hash(value.password, 10);
        
        // Create user with hashed password
        const user = await User.create({
            ...value,
            password: value.password,  // This will be used by virtual field
            password_hash: hashedPassword  // Explicitly set the hashed password
        });

        // Remove sensitive data from response
        const { password_hash, password, ...userWithoutPassword } = user.toJSON();
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas tworzenia użytkownika',
            error: error.message
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] },
            include: [{
                model: Review,
                as: 'reviews',
                attributes: ['id']
            }]
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas pobierania użytkowników',
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{
                model: Review,
                as: 'reviews'
            }]
        });

        if (!user) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas pobierania użytkownika',
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { error, value } = userUpdateSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                message: 'Błąd walidacji',
                errors: error.details.map(err => err.message)
            });
        }

        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        if (value.username || value.email) {
            const existingUser = await User.findOne({
                where: {
                    id: { [Op.ne]: req.params.id },
                    [Op.or]: [
                        value.username ? { username: value.username } : null,
                        value.email ? { email: value.email } : null
                    ].filter(Boolean)
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'Użytkownik o takiej nazwie lub emailu już istnieje'
                });
            }
        }

        await user.update(value);
        const { password_hash, ...userWithoutPassword } = user.toJSON();
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas aktualizacji użytkownika',
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        await user.destroy();
        res.json({ message: 'Użytkownik został pomyślnie usunięty' });
    } catch (error) {
        res.status(500).json({
            message: 'Błąd podczas usuwania użytkownika',
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};