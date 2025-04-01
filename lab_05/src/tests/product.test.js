const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const { connectToDatabase, getDb } = require('../config/db');

// Mock the db module
jest.mock('../config/db');

// Create a new express app for testing
const app = express();
const productRoutes = require('../routes/product.route');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

// Set up middleware
app.use(express.json());
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

let mongoServer;
let mockDb;
let connection;
let productsCollection;

// Sample product data for tests
const sampleProduct = {
  name: "Test Product",
  category: "62e9a3540c85a74fd8454456", // A valid ObjectId format
  price: 29.99,
  attributes: {
    color: "blue",
    size: "medium",
    inStock: true
  },
  category_info: {
    id: "62e9a3540c85a74fd8454456",
    name: "Electronics",
    parent: null
  }
};

// Create a product with a specific ID for testing
const createProduct = async (productData) => {
  const _id = new ObjectId();
  const result = await productsCollection.insertOne({
    _id,
    ...productData,
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { ...productData, _id };
};

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to in-memory database
  connection = await MongoClient.connect(uri);
  mockDb = connection.db('test');
  productsCollection = mockDb.collection('products');
  
  // Mock getDb to return our in-memory database
  getDb.mockImplementation(() => mockDb);
  connectToDatabase.mockResolvedValue(mockDb);
});

afterAll(async () => {
  await connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear database before each test
  await productsCollection.deleteMany({});
});



describe('Product API', () => {
  describe('GET /api/products', () => {
    it('should get all products', async () => {
      // Create test products
      await createProduct(sampleProduct);
      await createProduct({...sampleProduct, name: "Product 2"});
      
      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        products: expect.arrayContaining([
          expect.objectContaining({ name: expect.any(String) })
        ]),
        pagination: expect.any(Object)
      });
      expect(res.body.products).toHaveLength(2);
    });
    
    it('should filter products by category', async () => {
      const product1 = await createProduct(sampleProduct);
      const product2 = await createProduct({
        ...sampleProduct, 
        category: "62e9a3540c85a74fd8454457" // Different category
      });
      
      const res = await request(app)
        .get(`/api/products?category=${product1.category}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        products: [
          expect.objectContaining({ name: product1.name })
        ]
      });
      expect(res.body.products).toHaveLength(1);
    });
    
    it('should filter products by price range', async () => {
      await createProduct({...sampleProduct, price: 10.99});
      await createProduct({...sampleProduct, price: 20.99});
      await createProduct({...sampleProduct, price: 30.99});
      
      const res = await request(app)
        .get('/api/products?minPrice=15&maxPrice=25');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        products: [
          expect.objectContaining({ price: 20.99 })
        ]
      });
      expect(res.body.products).toHaveLength(1);
    });
  });
  
  describe('GET /api/products/:id', () => {
    it('should get a product by ID', async () => {
      const product = await createProduct(sampleProduct);
      
      const res = await request(app)
        .get(`/api/products/${product._id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        name: product.name,
        price: product.price,
        attributes: expect.any(Object)
      });
    });
    
    it('should return 404 if product not found', async () => {
      const nonExistentId = new ObjectId();
      
      const res = await request(app)
        .get(`/api/products/${nonExistentId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('not found')
      });
    });
    
    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .get('/api/products/invalid-id');
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Invalid product ID format')
      });
    });
  });
  
  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(sampleProduct);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        product: expect.objectContaining({
          name: sampleProduct.name,
          price: sampleProduct.price,
          attributes: expect.objectContaining(sampleProduct.attributes)
        })
      });
      
      // Verify it was saved to the database
      const savedProduct = await productsCollection.findOne({ name: sampleProduct.name });
      expect(savedProduct).toMatchObject({
        name: sampleProduct.name,
        price: sampleProduct.price
      });
    });
    
    it('should validate required fields', async () => {
      const invalidProduct = {
        name: "Missing Fields Product"
        // Missing required fields
      };
      
      const res = await request(app)
        .post('/api/products')
        .send(invalidProduct);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('PATCH /api/products/:id/price', () => {
    it('should update product price', async () => {
      const product = await createProduct(sampleProduct);
      const newPrice = 39.99;
      
      const res = await request(app)
        .patch(`/api/products/${product._id}/price`)
        .send({ price: newPrice });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        product: expect.objectContaining({ price: newPrice })
      });
      
      // Verify it was updated in the database
      const updatedProduct = await productsCollection.findOne({ _id: product._id });
      expect(updatedProduct).toMatchObject({ price: newPrice });
    });
  });
  
  describe('GET /api/products/search/attribute', () => {
    it('should search products by attribute', async () => {
      await createProduct(sampleProduct);
      await createProduct({
        ...sampleProduct,
        attributes: { color: "red", size: "large" }
      });
      
      const res = await request(app)
        .get('/api/products/search/attribute?name=color&value=blue');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        products: [
          expect.objectContaining({
            attributes: expect.objectContaining({ color: 'blue' })
          })
        ]
      });
      expect(res.body.products).toHaveLength(1);
    });
  });
});