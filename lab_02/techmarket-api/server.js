const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const {notFound, errorHandler} = require('./src/middlewares/errorMiddleware');


const productRoutes = require('./src/routes/productRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/',(req,res) => {
    res.send('API dla TechMarket działa poprawnie')
})

app.use('/api/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`API DZIAŁA NA PORCIE ${PORT}`);
});