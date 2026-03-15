const pool = require('../db');

// GET /api/cleaners
async function listar(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM cleaners ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// POST /api/cleaners
async function criar(req, res) {
  const { name, type, default_area, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO cleaners (name, type, default_area, phone)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, type || 'fixa', default_area || null, phone || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// PUT /api/cleaners/:id
async function atualizar(req, res) {
  const { id } = req.params;
  const { name, type, default_area, phone, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE cleaners SET name=$1, type=$2, default_area=$3, phone=$4, active=$5
       WHERE id=$6 RETURNING *`,
      [name, type, default_area, phone, active, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Colaboradora não encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// DELETE /api/cleaners/:id
async function remover(req, res) {
  try {
    await pool.query('UPDATE cleaners SET active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Colaboradora desativada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listar, criar, atualizar, remover };
