const pool = require('../db');
const { notificarGrupoLimpeza } = require('../services/whatsapp');

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
  const { client_name, client_company, meeting_date, start_time, end_time, room_id, notes, attendees } = req.body;
  if (!client_name || !meeting_date || !start_time || !end_time)
    return res.status(400).json({ error: 'Cliente, data, inicio e fim sao obrigatorios' });

  try {
    // Cria a reuniao
    const { rows } = await pool.query(
      `INSERT INTO client_meetings (user_id, client_name, client_company, meeting_date, start_time, end_time, room_id, notes, attendees)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, client_name, client_company||null, meeting_date, start_time, end_time, room_id||null, notes||null, attendees||null]
    );
    const meeting = rows[0];

    // Reserva a sala automaticamente se foi selecionada
    if (room_id) {
      await pool.query(
        `INSERT INTO room_bookings (room_id, user_id, title, start_time, end_time)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING`,
        [room_id, req.user.id, `Reuniao: ${client_name}`, `${meeting_date}T${start_time}`, `${meeting_date}T${end_time}`]
      ).catch(() => {});
    }

    // Busca nome da sala
    let salaNome = 'A definir';
    if (room_id) {
      const sala = await pool.query('SELECT name FROM rooms WHERE id=$1', [room_id]);
      salaNome = sala.rows[0]?.name || 'A definir';
    }

    // Notifica grupo WhatsApp
    const dataFormatada = new Date(meeting_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    const msg = [
      `🤝 *Reuniao com cliente agendada!*`,
      ``,
      `👤 *Cliente:* ${client_name}${client_company ? ` (${client_company})` : ''}`,
      `📅 *Data:* ${dataFormatada}`,
      `🕐 *Horario:* ${start_time.slice(0,5)} ate ${end_time.slice(0,5)}`,
      `🚪 *Sala:* ${salaNome}`,
      notes ? `📝 *Obs:* ${notes}` : '',
      ``,
      `Por favor, prepare o espaco antes do horario! 🧹`,
    ].filter(Boolean).join('\n');

    await notificarGrupoLimpeza(msg);
    res.status(201).json(meeting);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { client_name, client_company, meeting_date, start_time, end_time, room_id, notes, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE client_meetings SET client_name=$1, client_company=$2, meeting_date=$3,
       start_time=$4, end_time=$5, room_id=$6, notes=$7, status=$8
       WHERE id=$9 RETURNING *`,
      [client_name, client_company, meeting_date, start_time, end_time, room_id, notes, status || 'agendado', id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Reuniao nao encontrada' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function remover(req, res) {
  try {
    await pool.query('UPDATE client_meetings SET status=$1 WHERE id=$2', ['cancelado', req.params.id]);
    res.json({ message: 'Reuniao cancelada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listar, criar, atualizar, remover };
