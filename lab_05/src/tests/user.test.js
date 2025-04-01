const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const { connectToDatabase, getDb } = require('../config/db');

// Mock the db module
jest.mock('../config/db');

// Create a new express app for testing
const app = express();
const userRoutes = require('../routes/user.route');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

// Set up middleware
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

let mongoServer;
let mockDb;
let connection;
let usersCollection;

// Sample user data for tests
const sampleUser = {
  username: "testuser",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  password: "password123",
  isActive: true
};

// Create a user with a specific ID for testing
const createUser = async (userData) => {
  const _id = new ObjectId();
  await usersCollection.insertOne({
    _id,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { ...userData, _id };
};

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to in-memory database
  connection = await MongoClient.connect(uri);
  mockDb = connection.db('test');
  usersCollection = mockDb.collection('users');
  
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
  await usersCollection.deleteMany({});
});



describe('User API', () => {
  describe('GET /api/users', () => {
    it('should get all users with pagination', async () => {
      // Create test users
      await createUser(sampleUser);
      await createUser({...sampleUser, username: "user2", email: "user2@example.com"});
      
      const res = await request(app).get('/api/users');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        users: expect.arrayContaining([
          expect.objectContaining({
            username: expect.any(String),
            email: expect.any(String)
          })
        ]),
        pagination: expect.any(Object)
      });
      expect(res.body.users).toHaveLength(2);
      
      // Make sure passwords are not returned
      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });
  
  describe('GET /api/users/:id', () => {
    it('should get a user by ID', async () => {
      const user = await createUser(sampleUser);
      
      const res = await request(app)
        .get(`/api/users/${user._id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
      expect(res.body).not.toHaveProperty('password');
    });
    
    it('should return 404 if user not found', async () => {
      const nonExistentId = new ObjectId();
      
      const res = await request(app)
        .get(`/api/users/${nonExistentId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('not found')
      });
    });
    
    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .get('/api/users/invalid-id');
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Invalid user ID format')
      });
    });
  });
  
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send(sampleUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        user: expect.objectContaining({
          username: sampleUser.username,
          email: sampleUser.email,
          firstName: sampleUser.firstName,
          lastName: sampleUser.lastName
        })
      });
      expect(res.body.user).not.toHaveProperty('password');
      
      // Verify it was saved to the database
      const savedUser = await usersCollection.findOne({ email: sampleUser.email });
      expect(savedUser).toMatchObject({
        username: sampleUser.username,
        email: sampleUser.email,
        password: sampleUser.password // In a real app, this would be hashed
      });
    });
    
    it('should validate required fields', async () => {
      const invalidUser = {
        username: "testuser"
        // Missing required fields
      };
      
      const res = await request(app)
        .post('/api/users')
        .send(invalidUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
    
    it('should prevent duplicate emails', async () => {
      // Create a user first
      await createUser(sampleUser);
      
      // Try to create another user with the same email
      const res = await request(app)
        .post('/api/users')
        .send(sampleUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Email already in use')
      });
    });
    
    it('should prevent duplicate usernames', async () => {
      // Create a user first
      await createUser(sampleUser);
      
      // Try to create another user with the same username but different email
      const res = await request(app)
        .post('/api/users')
        .send({
          ...sampleUser,
          email: "different@example.com"
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Username already taken')
      });
    });
  });
  
  describe('PUT /api/users/:id', () => {
    it('should update user information', async () => {
      const user = await createUser(sampleUser);
      const updates = {
        firstName: "Updated",
        lastName: "Name"
      };
      
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .send(updates);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        user: expect.objectContaining({
          firstName: updates.firstName,
          lastName: updates.lastName,
          email: user.email // Unchanged fields remain the same
        })
      });
      
      // Verify it was updated in the database
      const updatedUser = await usersCollection.findOne({ _id: user._id });
      expect(updatedUser).toMatchObject({
        firstName: updates.firstName,
        lastName: updates.lastName
      });
    });
  });
  
  describe('POST /api/users/login', () => {
    it('should log in a user with valid credentials', async () => {
      // Create a user first
      await createUser(sampleUser);
      
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: sampleUser.email,
          password: sampleUser.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Login successful'),
        user: expect.objectContaining({
          username: sampleUser.username,
          email: sampleUser.email
        })
      });
      expect(res.body.user).not.toHaveProperty('password');
    });
    
    it('should reject login with incorrect password', async () => {
      // Create a user first
      await createUser(sampleUser);
      
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: sampleUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Invalid email or password')
      });
    });
    
    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: "nonexistent@example.com",
          password: sampleUser.password
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('Invalid email or password')
      });
    });
  });
});