-- Tworzenie tabeli 'users'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tworzenie tabeli 'products'
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50),
    stock_count INTEGER DEFAULT 0,
    brand VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wstawianie przykładowych danych do tabeli 'users' (jeśli tabela jest pusta)
INSERT INTO users (username, password, email)
SELECT 'user1', 'password1', 'user1@example.com'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'user1');

INSERT INTO users (username, password, email)
SELECT 'user2', 'password2', 'user2@example.com'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'user2');

-- Wstawianie przykładowych danych do tabeli 'products' (jeśli tabela jest pusta)
INSERT INTO products (name, description, price, category, stock_count, brand, image_url)
SELECT 'Laptop Dell XPS 13', 'Wysokiej jakości laptop dla profesjonalistów', 4999.99, 'Laptopy', 15, 'Dell', 'https://example.com/dell-xps-13.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Laptop Dell XPS 13');

INSERT INTO products (name, description, price, category, stock_count, brand, image_url)
SELECT 'iPhone 15 Pro', 'Najnowszy smartfon Apple z zaawansowanymi funkcjami', 5499.99, 'Smartfony', 8, 'Apple', 'https://example.com/iphone-15-pro.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'iPhone 15 Pro');

INSERT INTO products (name, description, price, category, stock_count, brand, image_url)
SELECT 'Sony WH-1000XM5', 'Słuchawki bezprzewodowe z aktywną redukcją szumów', 1499.99, 'Audio', 0, 'Sony', 'https://example.com/sony-wh1000xm5.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Sony WH-1000XM5');