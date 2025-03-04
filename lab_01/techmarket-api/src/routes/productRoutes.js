
const express = require('express');
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productControllers');

// Podstawowe ścieżki
router.route('/')
    .get(getProducts)
    .post(createProduct);

// Ścieżki z parametrem ID
router.route('/:id')
    .get(getProductById)
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;