const pool = require('../db');

async function listarSalas(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms WHERE active = true ORDER BY floor, name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

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

async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE room_bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listarSalas, listarReservas, criarReserva, atualizarStatus };
