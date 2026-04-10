require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => console.log('✅ WhatsApp Service: banco conectado'));
module.exports = pool;
