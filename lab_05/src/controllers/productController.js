const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

// Get all products with pagination, filtering and sorting
const getAllProducts = async (req, res) => {
  try {
    const db = getDb();
    
    // Extract query parameters for filtering and pagination
    const { 
      category, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Category filter
    if (category && ObjectId.isValid(category)) {
      filter.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get products
    const products = await db
      .collection('products')
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    // Get total count
    const total = await db.collection('products').countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const db = getDb();
    const productId = req.params.id;
    
    // Validate productId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    // Get product by ID
    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const db = getDb();
    const { name, category, price, attributes, category_info } = req.body;
    
    // Create product object
    const newProduct = {
      name,
      category,
      price: parseFloat(price),
      attributes: attributes || {},
      category_info,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert product
    const result = await db.collection('products').insertOne(newProduct);
    
    if (result.acknowledged) {
      res.status(201).json({
        message: 'Product created successfully',
        productId: result.insertedId,
        product: newProduct
      });
    } else {
      res.status(400).json({ message: 'Failed to create product' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const db = getDb();
    const productId = req.params.id;
    const { name, price, attributes } = req.body;
    
    // Validate productId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    // Create update object
    const updateData = {
      ...(name && { name }),
      ...(price && { price: parseFloat(price) }),
      ...(attributes && { attributes }),
      updatedAt: new Date()
    };
    
    // Update product
    const result = await db
      .collection('products')
      .updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateData }
      );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (result.modifiedCount > 0) {
      // Get updated product
      const updatedProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(productId) });
      
      res.json({
        message: 'Product updated successfully',
        product: updatedProduct
      });
    } else {
      res.status(400).json({ message: 'No changes were made to the product' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const db = getDb();
    const productId = req.params.id;
    
    // Validate productId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    // Check if product exists
    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete product
    const result = await db
      .collection('products')
      .deleteOne({ _id: new ObjectId(productId) });
    
    if (result.deletedCount > 0) {
      // Also delete all reviews for this product
      await db
        .collection('reviews')
        .deleteMany({ productId: productId.toString() });
      
      res.json({
        message: 'Product and its reviews deleted successfully',
        productId
      });
    } else {
      res.status(400).json({ message: 'Failed to delete product' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Update product price
const updatePrice = async (req, res) => {
  try {
    const db = getDb();
    const productId = req.params.id;
    const { price } = req.body;
    
    // Validate productId
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    // Update price
    const result = await db
      .collection('products')
      .updateOne(
        { _id: new ObjectId(productId) },
        { $set: { price: parseFloat(price), updatedAt: new Date() } }
      );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (result.modifiedCount > 0) {
      // Get updated product
      const updatedProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(productId) });
      
      res.json({
        message: 'Product price updated successfully',
        product: updatedProduct
      });
    } else {
      res.status(400).json({ message: 'No changes were made to the product price' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating product price', error: error.message });
  }
};

// Search products by attribute
const searchByAttribute = async (req, res) => {
  try {
    const db = getDb();
    const { name, value } = req.query;
    
    if (!name) {
      return res.status(400).json({ message: 'Attribute name is required' });
    }
    
    // Build the query
    const query = {};
    query[`attributes.${name}`] = value;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get products by attribute
    const products = await db
      .collection('products')
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count
    const total = await db.collection('products').countDocuments(query);
    
    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      search: { name, value }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching products by attribute', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updatePrice,
  searchByAttribute
};