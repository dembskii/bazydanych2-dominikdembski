const express = require('express');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  createProductSchema,
  priceUpdateSchema,
  attributeSearchSchema
} = require('../schemas/productSchema');

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updatePrice,
  searchByAttribute
} = require('../controllers/productController');

const router = express.Router();

// GET search products by attribute - this specific route must come before the /:id route
router.get('/search/attribute', searchByAttribute);

// GET all products with filtering, sorting and pagination
router.get('/', getAllProducts);

// GET product by ID
router.get('/:id', getProductById);

// POST create new product
router.post('/', validateRequest(createProductSchema, 'body'), createProduct);

// PUT update product
router.put('/:id', updateProduct);

// DELETE product
router.delete('/:id', deleteProduct);

// PATCH update product price
router.patch('/:id/price', validateRequest(priceUpdateSchema, 'body'), updatePrice);

module.exports = router;