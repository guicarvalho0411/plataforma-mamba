const pool = require('../db');
const { notificarGrupoLimpeza } = require('../services/whatsapp');
const { agendarLembreteBanco } = require('../services/reminderCron');

async function listar(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT cm.*, u.name AS agendado_por, r.name AS sala_nome
       FROM client_meetings cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN rooms r ON r.id = cm.room_id
       ORDER BY cm.meeting_date DESC, cm.start_time DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}


async function criar(req, res) {
  const { client_name, client_company, meeting_date, start_time, room_name, notes, cafe_agua } = req.body;
  if (!client_name || !meeting_date || !start_time)
    return res.status(400).json({ error: 'Cliente, data e horário são obrigatórios' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO client_meetings (user_id, client_name, client_company, meeting_date, start_time, end_time, notes, attendees)
       VALUES ($1,$2,$3,$4,$5,$5,$6,$7) RETURNING *`,
      [req.user.id, client_name, client_company || null, meeting_date, start_time, notes || null, room_name || null]
    );
    const meeting = rows[0];

    const dataFormatada = new Date(meeting_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    const msg = [
      `🤝 *Reunião com cliente agendada!*`,
      ``,
      `👤 *Cliente:* ${client_name}${client_company ? ` (${client_company})` : ''}`,
      `📅 *Data:* ${dataFormatada}`,
      `🕐 *Horário:* ${start_time.slice(0, 5)}`,
      room_name ? `🚪 *Sala:* ${room_name}` : '',
      notes ? `📝 *Obs:* ${notes}` : '',
      cafe_agua ? `☕ *Café e água:* Preparar para a reunião` : '',
      ``,
      `Por favor, prepare o espaço antes do horário! 🧹`,
    ].filter(Boolean).join('\n');

    await notificarGrupoLimpeza(msg);
    await agendarLembreteBanco(meeting.id, meeting_date, start_time);

    res.status(201).json(meeting);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { client_name, client_company, meeting_date, start_time, room_name, notes, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE client_meetings SET client_name=$1, client_company=$2, meeting_date=$3,
       start_time=$4, end_time=$4, notes=$5, attendees=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [client_name, client_company, meeting_date, start_time, notes, room_name, status || 'agendado', id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Reunião não encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function remover(req, res) {
  try {
    await pool.query('UPDATE client_meetings SET status=$1 WHERE id=$2', ['cancelado', req.params.id]);
    res.json({ message: 'Reunião cancelada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listar, criar, atualizar, remover };
