import {
    getAllCategories,
    getCategoryById,
    getCategoryWithProducts,
    addCategory,
    updateCategory,
    deleteCategory,
  } from '../category.controller.js';
  import prisma from '../../prismaClient.js';
  
  jest.mock('../../prismaClient.js', () => ({
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }));
  
  describe('Category Controller', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    test('getAllCategories should return all categories', async () => {
      const mockCategories = [{ id: 1, name: 'Category 1' }];
      prisma.category.findMany.mockResolvedValue(mockCategories);
  
      const req = {};
      const res = { json: jest.fn() };
  
      await getAllCategories(req, res);
  
      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCategories);
    });
  
    test('getCategoryById should return a category by ID', async () => {
      const mockCategory = { id: 1, name: 'Category 1' };
      prisma.category.findUnique.mockResolvedValue(mockCategory);
  
      const req = { params: { id: '1' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  
      await getCategoryById(req, res);
  
      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });
  
    test('getCategoryWithProducts should return a category with its products', async () => {
      const mockCategory = { id: 1, name: 'Category 1', products: [{ id: 1, name: 'Product 1' }] };
      prisma.category.findUnique.mockResolvedValue(mockCategory);
  
      const req = { params: { id: '1' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  
      await getCategoryWithProducts(req, res);
  
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { products: true },
      });
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });
  
    test('addCategory should create a new category', async () => {
      const mockCategory = { id: 1, name: 'New Category' };
      prisma.category.create.mockResolvedValue(mockCategory);
  
      const req = { body: { name: 'New Category', description: 'Description' } };
      const res = { json: jest.fn() };
  
      await addCategory(req, res);
  
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: 'New Category', description: 'Description' },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category added successfully',
        category: mockCategory,
      });
    });
  
    test('updateCategory should update an existing category', async () => {
      const mockCategory = { id: 1, name: 'Updated Category' };
      prisma.category.update.mockResolvedValue(mockCategory);
  
      const req = { params: { id: '1' }, body: { name: 'Updated Category' } };
      const res = { json: jest.fn() };
  
      await updateCategory(req, res);
  
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Category' },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category updated successfully',
        category: mockCategory,
      });
    });
  
    test('deleteCategory should delete a category by ID', async () => {
      const mockCategory = { id: 1, name: 'Category 1' };
      prisma.category.delete.mockResolvedValue(mockCategory);
  
      const req = { params: { id: '1' } };
      const res = { json: jest.fn() };
  
      await deleteCategory(req, res);
  
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category deleted successfully',
        category: mockCategory,
      });
    });
  });