import {
    getAllProducts,
    getSortedProducts,
    getAvailableProducts,
    getProductById,
    getProductWithCategory,
    addProduct,
    updateProduct,
    deleteProduct,
} from '../products.controller.js';
import prisma from '../../prismaClient.js';

jest.mock('../../prismaClient.js', () => {
    return {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    };
  });

describe('Products Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };

    test('getAllProducts should return all products', async () => {
        const mockProducts = [{ id: 1, name: 'Product 1' }];
        prisma.product.findMany.mockResolvedValue(mockProducts);

        const req = {};
        const res = mockRes();

        await getAllProducts(req, res);

        expect(prisma.product.findMany).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    test('getSortedProducts should return sorted products', async () => {
        const mockProducts = [{ id: 1, name: 'Product 1', price: 100 }];
        prisma.product.findMany.mockResolvedValue(mockProducts);

        const req = { query: { column: 'price' } };
        const res = mockRes();

        await getSortedProducts(req, res);

        expect(prisma.product.findMany).toHaveBeenCalledWith({ orderBy: { price: 'asc' } });
        expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    test('getAvailableProducts should return available products', async () => {
        const mockProducts = [{ id: 1, name: 'Product 1', isAvailable: true }];
        prisma.product.findMany.mockResolvedValue(mockProducts);

        const req = { query: { isAvailable: 'true' } };
        const res = mockRes();

        await getAvailableProducts(req, res);

        expect(prisma.product.findMany).toHaveBeenCalledWith({ where: { isAvailable: true } });
        expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    test('getProductById should return a product by ID', async () => {
        const mockProduct = { id: 1, name: 'Product 1' };
        prisma.product.findUnique.mockResolvedValue(mockProduct);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getProductById(req, res);

        expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    test('getProductWithCategory should return a product with its category', async () => {
        const mockProduct = { id: 1, name: 'Product 1', category: { id: 1, name: 'Category 1' } };
        prisma.product.findUnique.mockResolvedValue(mockProduct);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await getProductWithCategory(req, res);

        expect(prisma.product.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: { category: true },
        });
        expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    test('addProduct should create a new product', async () => {
        const mockProduct = { id: 1, name: 'New Product' };
        prisma.product.create.mockResolvedValue(mockProduct);
        
        const req = { 
            body: { 
                name: 'New Product', 
                categoryId: 1,  // Use categoryId instead of category
                price: 100, 
                stockCount: 10, 
                brand: 'Brand' 
            } 
        };
        const res = mockRes();
        
        await addProduct(req, res);
        
        expect(prisma.product.create).toHaveBeenCalledWith({
            data: { 
                name: 'New Product', 
                categoryId: 1, 
                price: 100, 
                stockCount: 10, 
                brand: 'Brand' 
            },
        });
        expect(res.json).toHaveBeenCalledWith({
            message: 'Product added successfully',
            product: mockProduct,
        });
    });

    // Fix updateProduct test
    test('updateProduct should update an existing product', async () => {
        // Setup mocks more carefully
        prisma.product.findUnique.mockResolvedValueOnce({ id: 1, name: 'OldProduct' });
        
        const mockProduct = { id: 1, name: 'Updated Product' };
        prisma.product.update.mockResolvedValueOnce(mockProduct);
        
        const req = { params: { id: '1' }, body: { name: 'Updated Product' } };
        const res = mockRes();
        
        await updateProduct(req, res);
        
        expect(prisma.product.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { name: 'Updated Product' },
        });
        expect(res.json).toHaveBeenCalledWith({
          message: 'Product updated successfully',
          product: mockProduct,
        });
      });

    test('deleteProduct should delete a product by ID', async () => {
        const mockProduct = { id: 1, name: 'Product 1' };
        prisma.product.delete.mockResolvedValue(mockProduct);

        const req = { params: { id: '1' } };
        const res = mockRes();

        await deleteProduct(req, res);

        expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith({
            message: 'Product deleted successfully',
            product: mockProduct,
        });
    });
});