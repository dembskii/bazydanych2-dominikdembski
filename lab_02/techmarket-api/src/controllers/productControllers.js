const productModel = require('../models/productModel');


const getProducts = async (req, res) => {
    try {
        const options = {
            available: req.query.available === 'true' ? true : 
                       req.query.available === 'false' ? false : undefined,
            category: req.query.category,
            sort: req.query.sort 
        };
        
        const products = await productModel.getAllProducts(options);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in getProducts:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Wystąpił błąd podczas pobierania produktów',
            error: error.message
        });
    }
};


const getProductById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'ID produktu musi być liczbą' 
            });
        }
        
        const product = await productModel.getProductById(id);
        
        if (!product) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Nie znaleziono produktu o podanym ID' 
            });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Error in getProductById:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Wystąpił błąd podczas pobierania produktu',
            error: error.message
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const newProduct = await productModel.createProduct(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Produkt został utworzony',
            product: newProduct
        });
    } catch (error) {
        console.error('Error in createProduct:', error);
        
        // Obsługa błędów walidacji
        if (error.message.includes('Błąd walidacji')) {
            return res.status(400).json({ 
                status: 'error',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            status: 'error',
            message: 'Wystąpił błąd podczas tworzenia produktu',
            error: error.message
        });
    }
};


const updateProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'ID produktu musi być liczbą' 
            });
        }
        
        const updatedProduct = await productModel.updateProduct(id, req.body);
        
        if (!updatedProduct) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Nie znaleziono produktu o podanym ID' 
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Produkt został zaktualizowany',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error in updateProduct:', error);
        
        if (error.message.includes('Błąd walidacji')) {
            return res.status(400).json({ 
                status: 'error',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            status: 'error',
            message: 'Wystąpił błąd podczas aktualizacji produktu',
            error: error.message
        });
    }
};


const deleteProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'ID produktu musi być liczbą' 
            });
        }
        
        const deletedProduct = await productModel.deleteProduct(id);
        
        if (!deletedProduct) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Nie znaleziono produktu o podanym ID' 
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Produkt został usunięty',
            product: deletedProduct
        });
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Wystąpił błąd podczas usuwania produktu',
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};