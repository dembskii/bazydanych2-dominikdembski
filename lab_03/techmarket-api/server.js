const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { notFound, errorHandler } = require('./src/middlewares/errorMiddleware');
const sequelize = require('./src/config/database');

// Import routes
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const userRoutes = require('./src/routes/userRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize database and sync models
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');
        
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

// Routes
app.get('/', (req, res) => {
    res.send('API dla TechMarket działa poprawnie');
});

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server after database initialization
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`API DZIAŁA NA PORCIE ${PORT}`);
    });
});