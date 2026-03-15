const pool = require('../db');

async function listar(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM cleaning_stock ORDER BY name`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function criar(req, res) {
  const { name, category, quantity, min_quantity, unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome e obrigatorio' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO cleaning_stock (name, category, quantity, min_quantity, unit)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, category||'Geral', quantity||0, min_quantity||1, unit||'un']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { name, category, quantity, min_quantity, unit } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE cleaning_stock SET name=$1, category=$2, quantity=$3, min_quantity=$4, unit=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, category, quantity, min_quantity, unit, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produto nao encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function darBaixa(req, res) {
  const { id } = req.params;
  const { quantidade } = req.body;
  if (!quantidade || quantidade <= 0)
    return res.status(400).json({ error: 'Quantidade invalida' });
  try {
    const { rows } = await pool.query(
      `UPDATE cleaning_stock SET quantity = GREATEST(0, quantity - $1), updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [quantidade, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produto nao encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function remover(req, res) {
  try {
    await pool.query('DELETE FROM cleaning_stock WHERE id=$1', [req.params.id]);
    res.json({ message: 'Produto removido' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listar, criar, atualizar, darBaixa, remover };
