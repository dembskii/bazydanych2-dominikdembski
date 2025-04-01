const express = require('express');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createReviewSchema, helpfulVoteSchema } = require('../schemas/reviewSchema');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  updateHelpfulVotes,
  getReviewStatistics,
  searchReviews
} = require('../controllers/reviewsController');

const router = express.Router();

// GET all reviews for a product with pagination and sorting
router.get('/product/:productId', getProductReviews);

// GET review statistics for a product
router.get('/product/:productId/stats', getReviewStatistics);

// POST create a new review
router.post('/', validateRequest(createReviewSchema, 'body'), createReview);

// PUT update an existing review
router.put('/:id', updateReview);

// DELETE a review
router.delete('/:id', deleteReview);

// PATCH update helpful votes for a review
router.patch('/:id/helpful', validateRequest(helpfulVoteSchema, 'body'), updateHelpfulVotes);

// NEW: Advanced search for reviews
router.get('/search', searchReviews);

module.exports = router;