const pool = require('../db');

// GET /api/tickets
async function listar(req, res) {
  const { status, category_id } = req.query;
  let query = `
    SELECT t.*, u.name AS solicitante, a.name AS responsavel, tc.name AS categoria
    FROM tickets t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN users a ON a.id = t.assigned_to
    JOIN ticket_categories tc ON tc.id = t.category_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
  if (category_id) { params.push(category_id); query += ` AND t.category_id = $${params.length}`; }
  query += ' ORDER BY t.opened_at DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/tickets
async function criar(req, res) {
  const { category_id, description, location, priority } = req.body;
  if (!category_id || !description)
    return res.status(400).json({ error: 'Categoria e descrição são obrigatórios' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO tickets (category_id, user_id, description, location, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category_id, req.user.id, description, location || null, priority || 'media']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/tickets/:id/status
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const validos = ['aberto', 'em_andamento', 'resolvido', 'cancelado'];
  if (!validos.includes(status))
    return res.status(400).json({ error: 'Status inválido' });

  try {
    const closed_at = status === 'resolvido' ? 'NOW()' : 'NULL';
    const started_at = status === 'em_andamento' ? 'NOW()' : 'started_at';
    const { rows } = await pool.query(
      `UPDATE tickets SET status = $1, assigned_to = $2,
       started_at = CASE WHEN status = 'aberto' THEN NOW() ELSE started_at END,
       closed_at  = CASE WHEN $1 = 'resolvido'  THEN NOW() ELSE NULL END
       WHERE id = $3 RETURNING *`,
      [status, req.user.id, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Chamado não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/tickets/:id/rating
async function avaliar(req, res) {
  const { id } = req.params;
  const { rating, rating_note } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });

  try {
    const { rows } = await pool.query(
      `UPDATE tickets SET rating = $1, rating_note = $2 WHERE id = $3 AND user_id = $4 RETURNING *`,
      [rating, rating_note || null, id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Chamado não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/tickets/categorias
async function categorias(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM ticket_categories WHERE active = true ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, criar, atualizarStatus, avaliar, categorias };
