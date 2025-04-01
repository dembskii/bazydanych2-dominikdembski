const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const db = getDb();
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await db
      .collection('users')
      .find({}, { projection: { password: 0 } }) // Don't return passwords
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count
    const total = await db.collection('users').countDocuments();
    
    // Return users with pagination info
    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.id;
    
    // Validate userId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Find user by ID
    const user = await db
      .collection('users')
      .findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Don't return password
      );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const db = getDb();
    const { username, email, firstName, lastName, password } = req.body;
    
    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if username already exists
    const existingUsername = await db.collection('users').findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Create new user
    const newUser = {
      username,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      password, // In a real app, this should be hashed
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);
    
    if (result.acknowledged) {
      // Return new user without password
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        message: 'User created successfully',
        userId: result.insertedId,
        user: userWithoutPassword
      });
    } else {
      res.status(400).json({ message: 'Failed to create user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.id;
    const { firstName, lastName, email, isActive } = req.body;
    
    // Validate userId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Create update object
    const updateData = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    };
    
    // Check if email exists if trying to update email
    if (email) {
      const existingUser = await db
        .collection('users')
        .findOne({ email, _id: { $ne: new ObjectId(userId) } });
        
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user
    const result = await db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (result.modifiedCount > 0) {
      // Get updated user
      const updatedUser = await db
        .collection('users')
        .findOne(
          { _id: new ObjectId(userId) },
          { projection: { password: 0 } }
        );
      
      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } else {
      res.status(400).json({ message: 'No changes were made to the user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.id;
    
    // Validate userId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    
    if (result.deletedCount > 0) {
      res.json({
        message: 'User deleted successfully',
        userId
      });
    } else {
      res.status(400).json({ message: 'Failed to delete user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// User login
const loginUser = async (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body;
    
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password (in a real app, you would compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // User authenticated - in a real app, you would generate a JWT token here
    const { password: userPassword, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser
};