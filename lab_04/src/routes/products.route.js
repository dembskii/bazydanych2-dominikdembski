import express from 'express';
import { getAllProducts, getSortedProducts, getAvailableProducts, getProductById, getProductWithCategory, addProduct, updateProduct, deleteProduct } from '../controllers/products.controller.js';

const router = express.Router();

// GET method routes
router.get('/', getAllProducts);
router.get('/sort', getSortedProducts);
router.get('/available', getAvailableProducts); 
router.get('/:id', getProductById);
router.get('/category/:id', getProductWithCategory);

// POST method routes
router.post('/', addProduct);

// PATCH method routes
router.patch('/:id', updateProduct);

// DELETE method routes
router.delete('/:id', deleteProduct);

export default router;