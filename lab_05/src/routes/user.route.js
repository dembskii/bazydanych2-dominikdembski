const express = require('express');
const { validateRequest } = require('../middleware/validationMiddleware');
const { userSchema, loginSchema } = require('../schemas/userSchema');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

// GET all users with pagination
router.get('/', getAllUsers);

// GET user by ID
router.get('/:id', getUserById);

// POST create new user
router.post('/', validateRequest(userSchema, 'body'), createUser);

// PUT update user
router.put('/:id', updateUser);

// DELETE user
router.delete('/:id', deleteUser);

module.exports = router;