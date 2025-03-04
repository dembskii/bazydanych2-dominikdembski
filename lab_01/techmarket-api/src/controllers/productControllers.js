const products = require('../data/products');

const getProducts = (req, res) => {
    res.json(products);
};

const getProductById = (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Nie znaleziono produktu');
    }
};

const createProduct = (req, res) => {
    const { name, category, description, price, stockCount, brand, imageUrl } = req.body;
    
    if (!name || !price) {
        res.status(400);
        throw new Error('Wymagane pola: nazwa i cena');
    }

    const product = {
        id: products.length + 1,
        name,
        category,
        description,
        price: parseFloat(price),
        stockCount: stockCount || 0,
        brand,
        imageUrl: imageUrl || null,
        isAvailable: stockCount > 0,
        createdAt: new Date().toISOString()
    };

    products.push(product);
    res.status(201).json(product);
};

const updateProduct = (req, res) => {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index !== -1) {
        const updatedProduct = {
            ...products[index],
            ...req.body,
            isAvailable: req.body.stockCount ? req.body.stockCount > 0 : products[index].stockCount > 0
        };
        products[index] = updatedProduct;
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Nie znaleziono produktu');
    }
};

const deleteProduct = (req, res) => {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index !== -1) {
        const deletedProduct = products.splice(index, 1);
        res.json({ message: 'Produkt został usunięty', product: deletedProduct[0] });
    } else {
        res.status(404);
        throw new Error('Nie znaleziono produktu');
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};