// src/schemas/userSchema.js
const Joi = require('joi');

// User schema
const userSchema = Joi.object({
  username: Joi.string().required().min(3).max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain alphanumeric characters and underscores',
      'string.min': 'Username must be at least {#limit} characters',
      'string.max': 'Username cannot exceed {#limit} characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string().email({ minDomainSegments: 2 }).required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  firstName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s-']+$/)
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens and apostrophes',
      'string.min': 'First name must be at least {#limit} characters',
      'string.max': 'First name cannot exceed {#limit} characters'
    }),
  lastName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s-']+$/)
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens and apostrophes',
      'string.min': 'Last name must be at least {#limit} characters',
      'string.max': 'Last name cannot exceed {#limit} characters'
    }),
  password: Joi.string().required().min(6).max(100)
    .messages({
      'string.min': 'Password must be at least {#limit} characters',
      'string.max': 'Password cannot exceed {#limit} characters',
      'any.required': 'Password is required' 
    }),
  isActive: Joi.boolean().default(true),
  createdAt: Joi.date().default(Date.now)
}).required();



module.exports = {
  userSchema
};