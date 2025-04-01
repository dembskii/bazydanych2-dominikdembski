import express from 'express';
import { getAllReviews, getReviewById, getReviewsByProductId, addReview, updateReview, deleteReview } from '../controllers/review.controller.js';

const router = express.Router();


//GET method routes
router.get('/', getAllReviews);
router.get('/:id', getReviewById);
router.get("/product-review/:id", getReviewsByProductId);

//POST method routes
router.post('/', addReview);

//PATCH method routes
router.patch('/:id', updateReview);

//DELETE method routes
router.delete('/:id', deleteReview);


export default router;