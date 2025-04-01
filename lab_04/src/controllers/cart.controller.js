import prisma from '../prismaClient.js';
import Joi from 'joi';

// Walidacja danych wejściowych dla koszyka
const cartSchema = Joi.object({
    userId: Joi.number().integer().required().messages({
        'number.base': 'User ID must be a number.',
        'number.integer': 'User ID must be an integer.',
        'any.required': 'User ID is required.'
    }),
    productId: Joi.number().integer().required().messages({
        'number.base': 'Product ID must be a number.',
        'number.integer': 'Product ID must be an integer.',
        'any.required': 'Product ID is required.'
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.base': 'Quantity must be a number.',
        'number.integer': 'Quantity must be an integer.',
        'number.min': 'Quantity must be at least 1.',
        'any.required': 'Quantity is required.'
    }),
});

// Pobierz koszyk użytkownika
const getCartByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Pobierz wszystkie produkty w koszyku użytkownika
        const cart = await prisma.cart.findMany({
            where: { userId: parseInt(userId) },
            include: { product: true }, // Dołącz szczegóły produktu
        });

        if (cart.length > 0) {
            res.json(cart);
        } else {
            res.status(404).json({ message: 'Cart is empty for this user' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFullCartByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Pobierz koszyk użytkownika
        const cart = await prisma.cart.findUnique({
            where: { userId: parseInt(userId) },
            include: {
                user: true,
            }
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for this user' });
        }

        // Pobierz szczegóły produktów na podstawie productIds
        const products = await prisma.product.findMany({
            where: {
                id: { in: cart.productIds }, // Pobierz produkty, których ID są w tablicy productIds
            },
            include: {
                category: true, // Dołącz kategorię produktu
                reviews: true,  // Dołącz recenzje produktu
            },
        });

        // Zwróć pełne dane koszyka wraz z produktami
        res.json({
            ...cart,
            products,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Dodaj produkt do koszyka
const addToCart = async (req, res) => {
    try {
        const { error } = cartSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { userId, productId, quantity } = req.body;

        // Sprawdź, czy koszyk istnieje dla użytkownika
        let userCart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!userCart) {
            // Jeśli koszyk nie istnieje, utwórz go
            userCart = await prisma.cart.create({
                data: {
                    userId,
                    productIds: [productId], // Dodaj produkt do tablicy productIds
                    quantities: { [productId]: quantity }, // Dodaj ilość dla produktu
                },
            });
            return res.json({ message: 'Cart created and product added successfully', cart: userCart });
        }

        // Jeśli koszyk istnieje, sprawdź, czy produkt już w nim jest
        const productIndex = userCart.productIds.indexOf(productId);

        if (productIndex === -1) {
            // Jeśli produkt nie istnieje, dodaj go do tablicy productIds i ustaw ilość
            userCart = await prisma.cart.update({
                where: { id: userCart.id },
                data: {
                    productIds: [...userCart.productIds, productId],
                    quantities: {
                        ...userCart.quantities,
                        [productId]: quantity,
                    },
                },
            });
            return res.json({ message: 'Product added to cart successfully', cart: userCart });
        }

        // Jeśli produkt już istnieje, zwiększ ilość
        userCart.quantities[productId] += quantity;

        userCart = await prisma.cart.update({
            where: { id: userCart.id },
            data: {
                quantities: userCart.quantities,
            },
        });

        res.json({ message: 'Product quantity updated successfully', cart: userCart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Zaktualizuj ilość produktu w koszyku
const updateCartItem = async (req, res) => {
    try {
        const { cartId, productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1.' });
        }

        // Pobierz koszyk na podstawie ID
        const userCart = await prisma.cart.findUnique({
            where: { id: parseInt(cartId) },
        });

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found.' });
        }

        // Sprawdź, czy produkt istnieje w koszyku
        const productExists = userCart.productIds.includes(parseInt(productId));
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found in the cart.' });
        }

        // Zaktualizuj ilość produktu w polu `quantities`
        const updatedQuantities = { ...userCart.quantities, [productId]: quantity };

        // Zaktualizuj koszyk w bazie danych
        const updatedCart = await prisma.cart.update({
            where: { id: parseInt(cartId) },
            data: {
                quantities: updatedQuantities,
            },
        });

        res.json({ message: 'Cart item updated successfully', cart: updatedCart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Usuń koszyk
const deleteCart = async (req, res) => {
    try {
        const { id } = req.params;

        // Usuń cały koszyk na podstawie jego id
        await prisma.cart.delete({
            where: { id: parseInt(id) },
        });

        res.json({ message: 'Cart deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Usuń produkt z koszyka
const removeCartItem = async (req, res) => {
    try {
        const { cartId, productId } = req.params;

        // Pobierz koszyk na podstawie ID
        const userCart = await prisma.cart.findUnique({
            where: { id: parseInt(cartId) },
        });

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found.' });
        }

        // Sprawdź, czy produkt istnieje w koszyku
        const productIndex = userCart.productIds.indexOf(parseInt(productId));
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in the cart.' });
        }

        // Usuń produkt z tablicy `productIds`
        const updatedProductIds = userCart.productIds.filter(id => id !== parseInt(productId));

        // Usuń produkt z obiektu `quantities`
        const updatedQuantities = { ...userCart.quantities };
        delete updatedQuantities[productId];

        // Zaktualizuj koszyk w bazie danych
        const updatedCart = await prisma.cart.update({
            where: { id: parseInt(cartId) },
            data: {
                productIds: updatedProductIds,
                quantities: updatedQuantities,
            },
        });

        res.json({ message: 'Product removed from cart successfully', cart: updatedCart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getCartByUserId,
    addToCart,
    updateCartItem,
    deleteCart,
    removeCartItem,
    getFullCartByUserId
};