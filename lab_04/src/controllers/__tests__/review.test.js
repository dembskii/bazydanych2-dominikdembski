import {
    getAllReviews,
    getReviewById,
    getReviewsByProductId,
    addReview,
    updateReview,
    deleteReview,
} from '../review.controller.js';
import prisma from '../../prismaClient.js';

jest.mock('../../prismaClient.js', () => {
    return {
      review: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    };
  });

describe('Review Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };

    test('getAllReviews should return all reviews', async () => {
        const mockReviews = [{ id: 1, rating: 5, comment: 'Great product!' }];
        prisma.review.findMany.mockResolvedValue(mockReviews);

        const req = {};
        const res = mockRes();

        await getAllReviews(req, res);

        expect(prisma.review.findMany).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockReviews);
    });

    test('getReviewById should return a review by ID', async () => {
        const mockReview = { id: 1, rating: 5, comment: 'Great product!' };
        prisma.review.findUnique.mockResolvedValue(mockReview);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getReviewById(req, res);

        expect(prisma.review.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith(mockReview);
    });

    test('getReviewsByProductId should return reviews for a specific product', async () => {
        const mockReviews = [{ id: 1, productId: 1, rating: 5, comment: 'Great product!' }];
        prisma.review.findMany.mockResolvedValue(mockReviews);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getReviewsByProductId(req, res);

        expect(prisma.review.findMany).toHaveBeenCalledWith({ where: { productId: 1 } });
        expect(res.json).toHaveBeenCalledWith(mockReviews);
    });

    test('addReview should create a new review', async () => {
        const mockReview = { id: 1, productId: 1, userId: 1, rating: 5, comment: 'Great product!' };
        prisma.review.create.mockResolvedValue(mockReview);

        const req = { body: { productId: 1, userId: 1, rating: 5, comment: 'Great product!' } };
        const res = mockRes();

        await addReview(req, res);

        expect(prisma.review.create).toHaveBeenCalledWith({
            data: { productId: 1, userId: 1, rating: 5, comment: 'Great product!' },
        });
        expect(res.json).toHaveBeenCalledWith({
            message: 'Review added successfully',
            review: mockReview,
        });
    });

// Then in the updateReview test:
    test('updateReview should update an existing review', async () => {
        // Setup mocks more carefully
        prisma.review.findUnique.mockResolvedValueOnce({ id: 1, rating: 5 });
        
        const mockReview = { id: 1, rating: 4 };
        prisma.review.update.mockResolvedValueOnce(mockReview);
        
        const req = { params: { id: '1' }, body: { rating: 4 } };
        const res = mockRes();
        
        await updateReview(req, res);
        
        expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { rating: 4 },
        });
        expect(res.json).toHaveBeenCalledWith({
        message: 'Review updated successfully',
        review: mockReview,
        });
    });

    test('deleteReview should delete a review by ID', async () => {
        const mockReview = { id: 1, rating: 5, comment: 'Great product!' };
        prisma.review.delete.mockResolvedValue(mockReview);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await deleteReview(req, res);

        expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith({
            message: 'Review deleted successfully',
            review: mockReview,
        });
    });
});