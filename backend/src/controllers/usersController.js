const pool = require('../db');
const bcrypt = require('bcrypt');

// GET /api/users
async function listar(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, department, active, created_at FROM users ORDER BY name'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// POST /api/users
async function criar(req, res) {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, department`,
      [name, email, hash, role || 'colaborador', department || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/users/:id
async function atualizar(req, res) {
  const { id } = req.params;
  const { name, email, role, department, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET name=$1, email=$2, role=$3, department=$4, active=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id, name, email, role, department, active`,
      [name, email, role, department, active, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// PATCH /api/users/:id/password
async function trocarSenha(req, res) {
  const { id } = req.params;
  const { senha_atual, nova_senha } = req.body;
  if (!senha_atual || !nova_senha)
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    const ok = await bcrypt.compare(senha_atual, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' });
    const hash = await bcrypt.hash(nova_senha, 10);
    await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, id]);
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listar, criar, atualizar, trocarSenha };
