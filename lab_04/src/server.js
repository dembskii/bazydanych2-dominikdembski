import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import { notFound, errorHandler } from './middleware/error.middleware.js';
import productRoutes from './routes/products.route.js';
import categoryRoutes from './routes/category.route.js';
import reviewRoutes from './routes/review.route.js';
import userRoutes from './routes/user.route.js';
import cartRoutes from './routes/cart.route.js';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	cors({
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	})
);

app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({mess: 'API is running'});
    }
)


app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);




app.use(notFound)
app.use(errorHandler)




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
