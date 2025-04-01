import express from 'express';

import { getCartByUserId, addToCart, updateCartItem, deleteCart, removeCartItem, getFullCartByUserId } from '../controllers/cart.controller.js';



const router = express.Router();

// GET routes
router.get('/user/:userId', getCartByUserId);
router.get('/user/full/:userId', getFullCartByUserId);

// POST routes
router.post('/', addToCart);

// PUT routes
router.patch('/:cartId/product/:productId', updateCartItem);

// DELETE routes
router.delete('/:id', deleteCart); 
router.delete('/:cartId/product/:productId', removeCartItem);

export default router;