import express from 'express';
import { getAllUsers, getUserById, getUserWithReviews, addUser, updateUser, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();


//GET method routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.get("/user-review/:id", getUserWithReviews);

//POST method routes
router.post('/', addUser);

//PATCH method routes
router.patch('/:id', updateUser);

//DELETE method routes
router.delete('/:id', deleteUser);


export default router;