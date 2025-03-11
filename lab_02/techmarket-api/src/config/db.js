const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'haslo123',
    port: process.env.DB_PORT || 5432,
});

const initDb = async () => {
    try {
        // Read SQL from the correct path
        const initScript = fs.readFileSync(
            path.join(__dirname, '../../init.sql')
        ).toString();
        
        await pool.query(initScript);
        console.log('Baza danych została zainicjalizowana.');
    } catch (err) {
        console.error('Błąd inicjalizacji bazy danych:', err);
    }
};

// Test connection and initialize DB
pool.connect((err, client, done) => {
    if (err) {
        console.error('Błąd połączenia z bazą danych:', err);
    } else {
        console.log('Połączenie z bazą danych ustanowione.');
        done();
        initDb();
    }
});

module.exports = {
    pool,
    initDb
};