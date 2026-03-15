const pool = require('../db');

// GET /api/schedules?week=2024-03-11
async function listar(req, res) {
  const { week } = req.query;
  const inicio = week || new Date().toISOString().split('T')[0];
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.name AS colaboradora, c.type AS tipo, c.default_area
       FROM schedules s
       JOIN cleaners c ON c.id = s.cleaner_id
       WHERE s.date >= $1::date AND s.date < $1::date + INTERVAL '7 days'
       ORDER BY s.date, c.name`,
      [inicio]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/schedules/cleaners
async function colaboradoras(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM cleaners WHERE active = true ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/schedules
async function criar(req, res) {
  const { cleaner_id, date, shift_start, shift_end, area, type } = req.body;
  if (!cleaner_id || !date || !type)
    return res.status(400).json({ error: 'Colaboradora, data e tipo são obrigatórios' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO schedules (cleaner_id, date, shift_start, shift_end, area, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (cleaner_id, date) DO UPDATE
       SET shift_start = $3, shift_end = $4, area = $5, type = $6, updated_at = NOW()
       RETURNING *`,
      [cleaner_id, date, shift_start || null, shift_end || null, area || null, type]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/schedules/hoje
async function hoje(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM vw_cleaners_today');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, colaboradoras, criar, hoje };
