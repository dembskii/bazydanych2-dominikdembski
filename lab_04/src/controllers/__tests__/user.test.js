import {
    getAllUsers,
    getUserById,
    getUserWithReviews,
    addUser,
    updateUser,
    deleteUser,
} from '../user.controller.js';
import prisma from '../../prismaClient.js';

// Mock Prisma Client
jest.mock('../../prismaClient.js', () => {
    return {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    };
  });

describe('User Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };

    test('getAllUsers should return all users', async () => {
        const mockUsers = [{ id: 1, username: 'User1' }];
        prisma.user.findMany.mockResolvedValue(mockUsers);

        const req = {};
        const res = mockRes();

        await getAllUsers(req, res);

        expect(prisma.user.findMany).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    test('getUserById should return a user by ID', async () => {
        const mockUser = { id: 1, username: 'User1' };
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getUserById(req, res);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('getUserById should return 404 if user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getUserById(req, res);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('getUserWithReviews should return a user with reviews', async () => {
        const mockUser = { id: 1, username: 'User1', reviews: [{ id: 1, comment: 'Great!' }] };
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getUserWithReviews(req, res);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { reviews: true },
        });
        expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('getUserWithReviews should return 404 if user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getUserWithReviews(req, res);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { reviews: true },
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    // Update this test
    test('addUser should create a new user', async () => {
        const mockUser = { id: 1, username: 'NewUser' };
        prisma.user.create.mockResolvedValue(mockUser);
        prisma.user.findUnique.mockResolvedValue(null); // Add this to mock email check
        
        const req = { body: { username: 'NewUser', email: 'test@example.com', passwordHash: 'hashed' } };
        const res = mockRes();
        
        await addUser(req, res);
        
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: { username: 'NewUser', email: 'test@example.com', passwordHash: 'hashed' },
        });
        expect(res.json).toHaveBeenCalledWith({
            success: true,  // Include the success field
            message: 'User added successfully',
            user: mockUser,
        });
    });

    // Also update this test
    test('addUser should return 400 if email already exists', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });
        
        const req = { body: { username: 'NewUser', email: 'test@example.com', passwordHash: 'hashed' } };
        const res = mockRes();
        
        await addUser(req, res);
        
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
            success: false,  // Include the success field
            message: 'A user with this email already exists' 
        });
    });

    test('updateUser should update an existing user', async () => {
        // Setup mocks more carefully
        prisma.user.findUnique.mockResolvedValueOnce({ id: 1, username: 'OldUsername' });
        
        const mockUser = { id: 1, username: 'UpdatedUser' };
        prisma.user.update.mockResolvedValueOnce(mockUser);
        
        const req = { params: { id: '1' }, body: { username: 'UpdatedUser' } };
        const res = mockRes();
        
        await updateUser(req, res);
        
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { username: 'UpdatedUser' },
        });
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'User updated successfully',
          user: mockUser,
        });
      });

    test('deleteUser should delete a user by ID', async () => {
        const mockUser = { id: 1, username: 'User1' };
        prisma.user.delete.mockResolvedValue(mockUser);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await deleteUser(req, res);

        expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith({
            message: 'User deleted successfully',
            user: mockUser,
        });
    });
});