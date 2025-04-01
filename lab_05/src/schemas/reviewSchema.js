// src/schemas/reviewSchema.js
const Joi = require('joi');

// Review schema
const createReviewSchema = Joi.object({
  productId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      'any.required': 'Product ID is required'
    }),
  userId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
      'any.required': 'User ID is required'
    }),
  rating: Joi.number().required().min(1).max(5).integer()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
      'number.integer': 'Rating must be an integer',
      'any.required': 'Rating is required'
    }),
  title: Joi.string().required().min(3).max(100).trim()
    .messages({
      'string.min': 'Title must be at least {#limit} characters',
      'string.max': 'Title cannot exceed {#limit} characters',
      'any.required': 'Title is required'
    }),
  content: Joi.string().required().min(10).max(1000).trim()
    .messages({
      'string.min': 'Review content must be at least {#limit} characters',
      'string.max': 'Review content cannot exceed {#limit} characters',
      'any.required': 'Review content is required'
    }),
  pros: Joi.array().items(
    Joi.string().min(2).max(100).trim()
      .messages({
        'string.min': 'Each pro point must be at least {#limit} characters',
        'string.max': 'Each pro point cannot exceed {#limit} characters'
      })
  ).min(0).max(10)
    .messages({
      'array.max': 'You can specify up to 10 pro points'
    }),
  cons: Joi.array().items(
    Joi.string().min(2).max(100).trim()
      .messages({
        'string.min': 'Each con point must be at least {#limit} characters',
        'string.max': 'Each con point cannot exceed {#limit} characters'
      })
  ).min(0).max(10)
    .messages({
      'array.max': 'You can specify up to 10 con points'
    }),
  verifiedPurchase: Joi.boolean().default(false),
  helpfulVotes: Joi.number().integer().min(0).default(0)
}).required();

// Schema for updating helpful votes
const helpfulVoteSchema = Joi.object({
  increment: Joi.boolean().required()
    .messages({
      'any.required': 'You must specify whether to increment or decrement the helpful votes'
    })
}).required();

// Schema for review search
const reviewSearchSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId'
    }),
  query: Joi.string().trim().allow('', null),
  minRating: Joi.number().integer().min(1).max(5),
  maxRating: Joi.number().integer().min(1).max(5),
  verifiedPurchase: Joi.boolean(),
  sortBy: Joi.string().valid('rating', 'createdAt', 'helpfulVotes', 'title'),
  sortOrder: Joi.string().valid('asc', 'desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  hasProsCons: Joi.boolean()
});

module.exports = {
  createReviewSchema,
  helpfulVoteSchema,
  reviewSearchSchema
};