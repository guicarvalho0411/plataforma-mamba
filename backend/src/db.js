const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('✅ Banco de dados conectado!'))
  .catch(err => console.error('❌ Erro ao conectar no banco:', err.message));

module.exports = pool;