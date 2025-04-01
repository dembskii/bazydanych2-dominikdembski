import {
    getCartByUserId,
    getFullCartByUserId,
    addToCart,
    updateCartItem,
    deleteCart,
    removeCartItem
  } from '../cart.controller.js';
  import prisma from '../../prismaClient.js';
  
  jest.mock('../../prismaClient.js', () => ({
    cart: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    product: {
      findMany: jest.fn()
    }
  }));
  
  describe('Cart Controller', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    const mockRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn().mockReturnThis();
      return res;
    };
  
    describe('getCartByUserId', () => {
      test('should return cart items for a user', async () => {
        const mockCartItems = [
          { id: 1, userId: 1, product: { id: 1, name: 'Test Product' } }
        ];
        prisma.cart.findMany.mockResolvedValue(mockCartItems);
  
        const req = { params: { userId: '1' } };
        const res = mockRes();
  
        await getCartByUserId(req, res);
  
        expect(prisma.cart.findMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          include: { product: true }
        });
        expect(res.json).toHaveBeenCalledWith(mockCartItems);
      });
  
      test('should return 404 when cart is empty', async () => {
        prisma.cart.findMany.mockResolvedValue([]);
  
        const req = { params: { userId: '1' } };
        const res = mockRes();
  
        await getCartByUserId(req, res);
  
        expect(prisma.cart.findMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          include: { product: true }
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Cart is empty for this user' });
      });
  
      test('should handle errors', async () => {
        prisma.cart.findMany.mockRejectedValue(new Error('Database error'));
  
        const req = { params: { userId: '1' } };
        const res = mockRes();
  
        await getCartByUserId(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
      });
    });
  
    describe('getFullCartByUserId', () => {
      test('should return full cart with products for a user', async () => {
        const mockCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 1 },
          user: { id: 1, username: 'testuser' }
        };
        const mockProducts = [
          { id: 1, name: 'Product 1', category: {}, reviews: [] },
          { id: 2, name: 'Product 2', category: {}, reviews: [] }
        ];
  
        prisma.cart.findUnique.mockResolvedValue(mockCart);
        prisma.product.findMany.mockResolvedValue(mockProducts);
  
        const req = { params: { userId: '1' } };
        const res = mockRes();
  
        await getFullCartByUserId(req, res);
  
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { userId: 1 },
          include: { user: true }
        });
        expect(prisma.product.findMany).toHaveBeenCalledWith({
          where: { id: { in: mockCart.productIds } },
          include: { category: true, reviews: true }
        });
        expect(res.json).toHaveBeenCalledWith({
          ...mockCart,
          products: mockProducts
        });
      });
  
      test('should return 404 when cart is not found', async () => {
        prisma.cart.findUnique.mockResolvedValue(null);
  
        const req = { params: { userId: '1' } };
        const res = mockRes();
  
        await getFullCartByUserId(req, res);
  
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { userId: 1 },
          include: { user: true }
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found for this user' });
      });
  
      test('should handle errors', async () => {
        prisma.cart.findUnique.mockRejectedValue(new Error('Database error'));
  
        const req = { params: { userId: '1' } };
        const res = mockRes();
  
        await getFullCartByUserId(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
      });
    });
  
    describe('addToCart', () => {
      test('should create a new cart if it does not exist', async () => {
        const mockCartData = {
          userId: 1,
          productIds: [2],
          quantities: { '2': 3 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(null);
        prisma.cart.create.mockResolvedValue({ id: 1, ...mockCartData });
        
        const req = { body: { userId: 1, productId: 2, quantity: 3 } };
        const res = mockRes();
        
        await addToCart(req, res);
        
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { userId: 1 }
        });
        expect(prisma.cart.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            productIds: [2],
            quantities: { '2': 3 }
          }
        });
        expect(res.json).toHaveBeenCalledWith({
          message: 'Cart created and product added successfully',
          cart: { id: 1, ...mockCartData }
        });
      });
      
      test('should add a new product to an existing cart', async () => {
        const existingCart = {
          id: 1,
          userId: 1,
          productIds: [1],
          quantities: { '1': 2 }
        };
        
        const updatedCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 3 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(existingCart);
        prisma.cart.update.mockResolvedValue(updatedCart);
        
        const req = { body: { userId: 1, productId: 2, quantity: 3 } };
        const res = mockRes();
        
        await addToCart(req, res);
        
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { userId: 1 }
        });
        expect(prisma.cart.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            productIds: [1, 2],
            quantities: { '1': 2, '2': 3 }
          }
        });
        expect(res.json).toHaveBeenCalledWith({
          message: 'Product added to cart successfully',
          cart: updatedCart
        });
      });
      
      test('should update quantity if product already exists in cart', async () => {
        const existingCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 1 }
        };
        
        const updatedCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 4 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(existingCart);
        prisma.cart.update.mockResolvedValue(updatedCart);
        
        const req = { body: { userId: 1, productId: 2, quantity: 3 } };
        const res = mockRes();
        
        await addToCart(req, res);
        
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { userId: 1 }
        });
        expect(prisma.cart.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            quantities: { '1': 2, '2': 4 }
          }
        });
        expect(res.json).toHaveBeenCalledWith({
          message: 'Product quantity updated successfully',
          cart: updatedCart
        });
      });
      
      test('should return 400 if validation fails', async () => {
        const req = { body: { userId: 1, productId: 2 } }; // Missing quantity
        const res = mockRes();
        
        await addToCart(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
      });
      
      test('should handle errors', async () => {
        prisma.cart.findUnique.mockRejectedValue(new Error('Database error'));
        
        const req = { body: { userId: 1, productId: 2, quantity: 3 } };
        const res = mockRes();
        
        await addToCart(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
      });
    });
  
    describe('updateCartItem', () => {
      test('should update the quantity of a product in the cart', async () => {
        const existingCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 1 }
        };
        
        const updatedCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 5 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(existingCart);
        prisma.cart.update.mockResolvedValue(updatedCart);
        
        const req = { params: { cartId: '1', productId: '2' }, body: { quantity: 5 } };
        const res = mockRes();
        
        await updateCartItem(req, res);
        
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { id: 1 }
        });
        expect(prisma.cart.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            quantities: { '1': 2, '2': 5 }
          }
        });
        expect(res.json).toHaveBeenCalledWith({
          message: 'Cart item updated successfully',
          cart: updatedCart
        });
      });
      
      test('should return 400 if quantity is invalid', async () => {
        const req = { params: { cartId: '1', productId: '2' }, body: { quantity: 0 } };
        const res = mockRes();
        
        await updateCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Quantity must be at least 1.' });
      });
      
      test('should return 404 if cart not found', async () => {
        prisma.cart.findUnique.mockResolvedValue(null);
        
        const req = { params: { cartId: '1', productId: '2' }, body: { quantity: 5 } };
        const res = mockRes();
        
        await updateCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found.' });
      });
      
      test('should return 404 if product not in cart', async () => {
        const existingCart = {
          id: 1,
          userId: 1,
          productIds: [1],
          quantities: { '1': 2 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(existingCart);
        
        const req = { params: { cartId: '1', productId: '2' }, body: { quantity: 5 } };
        const res = mockRes();
        
        await updateCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Product not found in the cart.' });
      });
      
      test('should handle errors', async () => {
        prisma.cart.findUnique.mockRejectedValue(new Error('Database error'));
        
        const req = { params: { cartId: '1', productId: '2' }, body: { quantity: 5 } };
        const res = mockRes();
        
        await updateCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
      });
    });
  
    describe('deleteCart', () => {
      test('should delete a cart', async () => {
        prisma.cart.delete.mockResolvedValue({ id: 1 });
        
        const req = { params: { id: '1' } };
        const res = mockRes();
        
        await deleteCart(req, res);
        
        expect(prisma.cart.delete).toHaveBeenCalledWith({
          where: { id: 1 }
        });
        expect(res.json).toHaveBeenCalledWith({ message: 'Cart deleted successfully' });
      });
      
      test('should handle errors', async () => {
        prisma.cart.delete.mockRejectedValue(new Error('Database error'));
        
        const req = { params: { id: '1' } };
        const res = mockRes();
        
        await deleteCart(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
      });
    });
  
    describe('removeCartItem', () => {
      test('should remove a product from cart', async () => {
        const existingCart = {
          id: 1,
          userId: 1,
          productIds: [1, 2],
          quantities: { '1': 2, '2': 3 }
        };
        
        const updatedCart = {
          id: 1,
          userId: 1,
          productIds: [1],
          quantities: { '1': 2 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(existingCart);
        prisma.cart.update.mockResolvedValue(updatedCart);
        
        const req = { params: { cartId: '1', productId: '2' } };
        const res = mockRes();
        
        await removeCartItem(req, res);
        
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
          where: { id: 1 }
        });
        expect(prisma.cart.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            productIds: [1],
            quantities: { '1': 2 }
          }
        });
        expect(res.json).toHaveBeenCalledWith({
          message: 'Product removed from cart successfully',
          cart: updatedCart
        });
      });
      
      test('should return 404 if cart not found', async () => {
        prisma.cart.findUnique.mockResolvedValue(null);
        
        const req = { params: { cartId: '1', productId: '2' } };
        const res = mockRes();
        
        await removeCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Cart not found.' });
      });
      
      test('should return 404 if product not in cart', async () => {
        const existingCart = {
          id: 1,
          userId: 1,
          productIds: [1],
          quantities: { '1': 2 }
        };
        
        prisma.cart.findUnique.mockResolvedValue(existingCart);
        
        const req = { params: { cartId: '1', productId: '2' } };
        const res = mockRes();
        
        await removeCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Product not found in the cart.' });
      });
      
      test('should handle errors', async () => {
        prisma.cart.findUnique.mockRejectedValue(new Error('Database error'));
        
        const req = { params: { cartId: '1', productId: '2' } };
        const res = mockRes();
        
        await removeCartItem(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
      });
    });
  });