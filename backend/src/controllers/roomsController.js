const pool = require('../db');

// GET /api/rooms
async function listarSalas(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY floor, name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// POST /api/rooms
async function criarSala(req, res) {
  const { name, floor, capacity, resources } = req.body;
  if (!name || !floor || !capacity)
    return res.status(400).json({ error: 'Nome, andar e capacidade são obrigatórios' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO rooms (name, floor, capacity, resources)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, floor, capacity, resources || {}]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// PUT /api/rooms/:id
async function atualizarSala(req, res) {
  const { id } = req.params;
  const { name, floor, capacity, resources, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE rooms SET name=$1, floor=$2, capacity=$3, resources=$4, active=$5 WHERE id=$6 RETURNING *`,
      [name, floor, capacity, resources || {}, active, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Sala não encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// GET /api/rooms/bookings
async function listarReservas(req, res) {
  const { date } = req.query;
  const dia = date || new Date().toISOString().split('T')[0];
  try {
    const { rows } = await pool.query(
      `SELECT rb.*, r.name AS sala, u.name AS solicitante
       FROM room_bookings rb
       JOIN rooms r ON r.id = rb.room_id
       JOIN users u ON u.id = rb.user_id
       WHERE rb.start_time::date = $1 AND rb.status = 'confirmado'
       ORDER BY rb.start_time`,
      [dia]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// POST /api/rooms/bookings
async function criarReserva(req, res) {
  const { room_id, title, start_time, end_time } = req.body;
  if (!room_id || !start_time || !end_time)
    return res.status(400).json({ error: 'Sala, início e fim são obrigatórios' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO room_bookings (room_id, user_id, title, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [room_id, req.user.id, title || null, start_time, end_time]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23P01') return res.status(409).json({ error: 'Horário já reservado para esta sala' });
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/rooms/bookings/:id/status
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE room_bookings SET status=$1 WHERE id=$2 RETURNING *', [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listarSalas, criarSala, atualizarSala, listarReservas, criarReserva, atualizarStatus };
