// src/schemas/productSchema.js
const Joi = require('joi');

// Schema for creating a product
const createProductSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim()
    .message({
      'string.min': 'Product name must be at least {#limit} characters',
      'string.max': 'Product name cannot exceed {#limit} characters',
      'any.required': 'Product name is required'
    }),
  category: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
    .message({
      'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId',
      'any.required': 'Category is required'
    }),
  price: Joi.number().required().min(0).precision(2)
    .message({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'number.precision': 'Price can have at most 2 decimal places',
      'any.required': 'Price is required'
    }),
  attributes: Joi.object().pattern(
    Joi.string().min(1).max(50), 
    Joi.alternatives().try(
      Joi.string().max(200),
      Joi.number(),
      Joi.boolean()
    )
  ).optional().messages({
    'object.base': 'Attributes must be key-value pairs with string, number, or boolean values'
  }),
  category_info: Joi.object({
    id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
      .message({
        'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId',
        'any.required': 'Category ID is required'
      }),
    name: Joi.string().required().min(2).max(50)
      .message({
        'string.min': 'Category name must be at least {#limit} characters',
        'string.max': 'Category name cannot exceed {#limit} characters',
        'any.required': 'Category name is required'
      }),
    parent: Joi.string().allow(null, '').pattern(/^[0-9a-fA-F]{24}$/)
      .message('Parent category ID must be a valid MongoDB ObjectId if provided')
  }).required()
}).required();

// Schema for updating product rating
const ratingSchema = Joi.object({
  rating: Joi.number().required().min(1).max(5).precision(1)
    .message({
      'number.base': 'Rating must be a number',
      'number.min': 'Rating must be at least {#limit}',
      'number.max': 'Rating cannot exceed {#limit}',
      'number.precision': 'Rating can have at most 1 decimal place',
      'any.required': 'Rating is required'
    })
}).required();

// Schema for updating product price
const priceUpdateSchema = Joi.object({
  price: Joi.number().required().min(0).precision(2)
    .message({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'number.precision': 'Price can have at most 2 decimal places',
      'any.required': 'Price is required'
    })
}).required();

// Schema for attribute search
const attributeSearchSchema = Joi.object({
  name: Joi.string().required().min(1).max(50)
    .message({
      'string.min': 'Attribute name must be at least {#limit} character',
      'string.max': 'Attribute name cannot exceed {#limit} characters',
      'any.required': 'Attribute name is required'
    }),
  value: Joi.alternatives().try(
    Joi.string().max(200),
    Joi.number(),
    Joi.boolean()
  ).required().messages({
    'any.required': 'Attribute value is required'
  })
}).required();

module.exports = {
  createProductSchema,
  ratingSchema,
  priceUpdateSchema,
  attributeSearchSchema
};