import express from 'express';
import { getAllCategories, getCategoryById, addCategory, updateCategory, deleteCategory, getCategoryWithProducts } from '../controllers/category.controller.js';

const router = express.Router();

//GET method routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.get('/products/:id', getCategoryWithProducts);

//POST method routes
router.post('/', addCategory);

//PATCH method routes
router.patch('/:id', updateCategory);

//DELETE method routes
router.delete('/:id', deleteCategory);

export default router;