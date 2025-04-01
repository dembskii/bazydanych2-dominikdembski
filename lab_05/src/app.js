const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const { connectToDatabase } = require('./config/db.js');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
const productRoutes = require('./routes/product.route.js');
const reviewRoutes = require('./routes/review.route.js');
const userRoutes = require('./routes/user.route.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Include only routes that exist
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server and connect to database
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`MongoDB connected successfully`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();