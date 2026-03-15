const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND active = true',
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
}

// POST /api/auth/register (apenas admin pode criar usuários)
async function register(req, res) {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name, email, hash, role || 'colaborador', department || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
}

module.exports = { login, register };
