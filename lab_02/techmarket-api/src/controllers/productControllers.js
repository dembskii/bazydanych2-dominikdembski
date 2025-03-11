const productModel = require('../models/productModel');

const getProducts = async (req, res) => {
    try {
        // Extract query parameters for filtering and sorting
        const options = {
            available: req.query.available === 'true' ? true : 
                      req.query.available === 'false' ? false : undefined,
            category: req.query.category,
            sort: req.query.sort // 'price' for ascending, '-price' for descending
        };
        
        const products = await productModel.getAllProducts(options);
        res.json(products);
    } catch (error) {
        res.status(500);
        throw new Error(`Error getting products: ${error.message}`);
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await productModel.getProductById(parseInt(req.params.id));
        if (product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error('Nie znaleziono produktu');
        }
    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(`Error getting product: ${error.message}`);
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, category, description, price, stockCount, brand, imageUrl } = req.body;
        
        if (!name || !price) {
            res.status(400);
            throw new Error('Wymagane pola: nazwa i cena');
        }

        const productData = {
            name,
            category,
            description,
            price: parseFloat(price),
            stockCount: stockCount || 0,
            brand,
            imageUrl: imageUrl || null
        };

        const newProduct = await productModel.createProduct(productData);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(`Error creating product: ${error.message}`);
    }
};

const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await productModel.updateProduct(
            parseInt(req.params.id),
            req.body
        );
        
        if (updatedProduct) {
            res.json(updatedProduct);
        } else {
            res.status(404);
            throw new Error('Nie znaleziono produktu');
        }
    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(`Error updating product: ${error.message}`);
    }
};

const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await productModel.deleteProduct(parseInt(req.params.id));
        
        if (deletedProduct) {
            res.json({ message: 'Produkt został usunięty', product: deletedProduct });
        } else {
            res.status(404);
            throw new Error('Nie znaleziono produktu');
        }
    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(`Error deleting product: ${error.message}`);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};