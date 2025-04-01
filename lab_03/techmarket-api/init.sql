-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Create tables in correct order
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    stock_count INTEGER DEFAULT 0 CHECK (stock_count >= 0),
    brand VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Wstawianie przykładowych danych do tabeli 'categories'
INSERT INTO categories (name, description)
SELECT 'Laptopy', 'Komputery przenośne, laptopy i notebooki'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Laptopy');

INSERT INTO categories (name, description)
SELECT 'Smartfony', 'Telefony komórkowe i smartfony'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Smartfony');

INSERT INTO categories (name, description)
SELECT 'Audio', 'Sprzęt audio, słuchawki i głośniki'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Audio');

-- Wstawianie przykładowych danych do tabeli 'products' (jeśli tabela jest pusta)
INSERT INTO products (name, description, price, category_id, stock_count, brand, image_url)
SELECT 'Laptop Dell XPS 13', 'Wysokiej jakości laptop dla profesjonalistów', 4999.99, 
       (SELECT id FROM categories WHERE name = 'Laptopy'), 15, 'Dell', 'https://example.com/dell-xps-13.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Laptop Dell XPS 13');

INSERT INTO products (name, description, price, category_id, stock_count, brand, image_url)
SELECT 'iPhone 15 Pro', 'Najnowszy smartfon Apple z zaawansowanymi funkcjami', 5499.99, 
       (SELECT id FROM categories WHERE name = 'Smartfony'), 8, 'Apple', 'https://example.com/iphone-15-pro.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'iPhone 15 Pro');

INSERT INTO products (name, description, price, category_id, stock_count, brand, image_url)
SELECT 'Sony WH-1000XM5', 'Słuchawki bezprzewodowe z aktywną redukcją szumów', 1499.99, 
       (SELECT id FROM categories WHERE name = 'Audio'), 0, 'Sony', 'https://example.com/sony-wh1000xm5.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Sony WH-1000XM5');

-- Wstawianie przykładowych danych do tabeli 'users'
INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin)
SELECT 'admin', 'admin@techmarket.com', '$2a$10$VUzJsdfskdsafs34kfdsalDJFkjsdds', 'Admin', 'User', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, email, password_hash, first_name, last_name)
SELECT 'jankowalski', 'jan@example.com', '$2a$10$VUADFAdf34343fgfdgREER434', 'Jan', 'Kowalski', FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'jankowalski');

-- Wstawianie przykładowych recenzji
INSERT INTO reviews (product_id, user_id, rating, comment)
SELECT 
    (SELECT id FROM products WHERE name = 'Laptop Dell XPS 13'),
    (SELECT id FROM users WHERE username = 'jankowalski'),
    5,
    'Świetny laptop, bardzo wydajny i lekki!'
WHERE NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE product_id = (SELECT id FROM products WHERE name = 'Laptop Dell XPS 13')
    AND user_id = (SELECT id FROM users WHERE username = 'jankowalski')
);

INSERT INTO reviews (product_id, user_id, rating, comment)
SELECT 
    (SELECT id FROM products WHERE name = 'iPhone 15 Pro'),
    (SELECT id FROM users WHERE username = 'jankowalski'),
    4,
    'Dobry telefon, ale trochę za drogi.'
WHERE NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE product_id = (SELECT id FROM products WHERE name = 'iPhone 15 Pro')
    AND user_id = (SELECT id FROM users WHERE username = 'jankowalski')
);