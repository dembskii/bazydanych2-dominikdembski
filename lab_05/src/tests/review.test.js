const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const { connectToDatabase, getDb } = require('../config/db');

// Mock the db module
jest.mock('../config/db');

// Create a new express app for testing
const app = express();
const reviewRoutes = require('../routes/review.route');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

// Set up middleware
app.use(express.json());
app.use('/api/reviews', reviewRoutes);
app.use(notFound);
app.use(errorHandler);

let mongoServer;
let mockDb;
let connection;
let reviewsCollection;
let productsCollection;

// Sample data for tests
const sampleProductId = new ObjectId();
const sampleUserId = new ObjectId();

const sampleReview = {
  productId: sampleProductId.toString(),
  userId: sampleUserId.toString(),
  rating: 4,
  title: "Great Product",
  content: "This is a really good product. I would buy it again.",
  pros: ["Durable", "Good value"],
  cons: ["A bit expensive"],
  verifiedPurchase: true
};

const sampleProduct = {
  _id: sampleProductId,
  name: "Test Product",
  price: 29.99,
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Create a review with a specific ID for testing
const createReview = async (reviewData) => {
  const _id = new ObjectId();
  await reviewsCollection.insertOne({
    _id,
    ...reviewData,
    helpfulVotes: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { ...reviewData, _id };
};

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to in-memory database
  connection = await MongoClient.connect(uri);
  mockDb = connection.db('test');
  reviewsCollection = mockDb.collection('reviews');
  productsCollection = mockDb.collection('products');
  
  // Mock getDb to return our in-memory database
  getDb.mockImplementation(() => mockDb);
  connectToDatabase.mockResolvedValue(mockDb);
  
  // Insert a test product
  await productsCollection.insertOne(sampleProduct);
});

afterAll(async () => {
  await connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear reviews before each test
  await reviewsCollection.deleteMany({});
  // Reset product ratings
  await productsCollection.updateOne(
    { _id: sampleProductId },
    { 
      $set: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }
  );
});

describe('Review API', () => {
  describe('GET /api/reviews/product/:productId', () => {
    it('should get all reviews for a product', async () => {
      // Create test reviews
      await createReview(sampleReview);
      await createReview({
        ...sampleReview,
        title: "Another Review",
        content: "This is another review of the product"
      });
      
      const res = await request(app).get(`/api/reviews/product/${sampleProductId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        reviews: expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            content: expect.any(String),
            rating: expect.any(Number)
          })
        ]),
        pagination: expect.any(Object)
      });
      expect(res.body.reviews).toHaveLength(2);
    });
    
    it('should sort reviews by specified field', async () => {
      // Create reviews with different ratings
      const review1 = await createReview({...sampleReview, rating: 2});
      const review2 = await createReview({...sampleReview, rating: 5});
      const review3 = await createReview({...sampleReview, rating: 3});
      
      const res = await request(app)
        .get(`/api/reviews/product/${sampleProductId}?sortBy=rating&sortOrder=asc`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        reviews: [
          expect.objectContaining({ rating: 2 }),
          expect.objectContaining({ rating: 3 }),
          expect.objectContaining({ rating: 5 })
        ],
        pagination: expect.any(Object)
      });
      expect(res.body.reviews).toHaveLength(3);
    });
  });
  
  describe('GET /api/reviews/product/:productId/stats', () => {
    it('should get review statistics for a product', async () => {
      // Create reviews with different ratings
      await createReview({...sampleReview, rating: 5});
      await createReview({...sampleReview, rating: 4});
      await createReview({...sampleReview, rating: 4});
      await createReview({...sampleReview, rating: 3});
      
      const res = await request(app).get(`/api/reviews/product/${sampleProductId}/stats`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        totalReviews: 4,
        averageRating: 4,
        ratingDistribution: {
          '1': 0,
          '2': 0,
          '3': 1,
          '4': 2,
          '5': 1
        }
      });
    });
  });
  
  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send(sampleReview);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        review: expect.objectContaining({
          title: sampleReview.title,
          rating: sampleReview.rating,
          content: sampleReview.content,
          pros: expect.arrayContaining(sampleReview.pros),
          cons: expect.arrayContaining(sampleReview.cons)
        })
      });
      
      // Verify it updates product ratings
      const product = await productsCollection.findOne({ _id: sampleProductId });
      expect(product).toMatchObject({
        totalReviews: 1,
        averageRating: sampleReview.rating,
        ratingDistribution: expect.objectContaining({
          [sampleReview.rating]: 1
        })
      });
    });
    
    it('should validate required fields', async () => {
      const invalidReview = {
        productId: sampleProductId.toString(),
        // Missing required fields
      };
      
      const res = await request(app)
        .post('/api/reviews')
        .send(invalidReview);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('PATCH /api/reviews/:id/helpful', () => {
    it('should increment helpful votes', async () => {
      const review = await createReview(sampleReview);
      
      const res = await request(app)
        .patch(`/api/reviews/${review._id}/helpful`)
        .send({ increment: true });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        helpfulVotes: 1,
        message: expect.stringContaining('upvoted')
      });
      
      // Verify in database
      const updatedReview = await reviewsCollection.findOne({ _id: review._id });
      expect(updatedReview).toMatchObject({ helpfulVotes: 1 });
    });
    
    it('should decrement helpful votes', async () => {
      // Create review with 2 helpful votes
      const review = await createReview(sampleReview);
      await reviewsCollection.updateOne(
        { _id: review._id },
        { $set: { helpfulVotes: 2 } }
      );
      
      const res = await request(app)
        .patch(`/api/reviews/${review._id}/helpful`)
        .send({ increment: false });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        helpfulVotes: 1,
        message: expect.stringContaining('downvoted')
      });
      
      // Verify in database
      const updatedReview = await reviewsCollection.findOne({ _id: review._id });
      expect(updatedReview).toMatchObject({ helpfulVotes: 1 });
    });
    
    it('should not allow helpful votes to go below 0', async () => {
      const review = await createReview(sampleReview);
      
      const res = await request(app)
        .patch(`/api/reviews/${review._id}/helpful`)
        .send({ increment: false });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('cannot go below 0')
      });
    });
  });
  
  describe('GET /api/reviews/search', () => {
    it('should search reviews by text content', async () => {
      await createReview(sampleReview);
      await createReview({
        ...sampleReview,
        title: "Not What I Expected",
        content: "This product was disappointing and not worth the price."
      });
      
      const res = await request(app)
        .get('/api/reviews/search?query=disappointin');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        reviews: [
          expect.objectContaining({
            title: "Not What I Expected",
            content: expect.stringContaining("disappointing")
          })
        ]
      });
      expect(res.body.reviews).toHaveLength(1);
    });
    
    it('should filter reviews by verified purchase', async () => {
      await createReview(sampleReview);
      await createReview({
        ...sampleReview,
        verifiedPurchase: false
      });
      
      const res = await request(app)
        .get('/api/reviews/search?verifiedPurchase=true');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        reviews: [
          expect.objectContaining({ verifiedPurchase: true })
        ]
      });
      expect(res.body.reviews).toHaveLength(1);
    });
    
    it('should filter reviews by rating range', async () => {
      await createReview({...sampleReview, rating: 2});
      await createReview({...sampleReview, rating: 3});
      await createReview({...sampleReview, rating: 4});
      await createReview({...sampleReview, rating: 5});
      
      const res = await request(app)
        .get('/api/reviews/search?minRating=4');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.reviews).toHaveLength(2);
      
      // Check that all returned reviews have rating >= 4
      res.body.reviews.forEach(review => {
        expect(review.rating).toBeGreaterThanOrEqual(4);
      });
    });
  });
});