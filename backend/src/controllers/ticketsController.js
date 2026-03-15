const pool = require('../db');
const { notificarGrupoLimpeza } = require('../services/whatsapp');

const CATEGORIA_ICONS = {
  'Copa / Cozinha': '☕',
  'Limpeza': '🧹',
  'Materiais de Escritório': '📎',
  'Manutencao': '🔧',
};

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
  if (status)      { params.push(status);      query += ` AND t.status = $${params.length}`; }
  if (category_id) { params.push(category_id); query += ` AND t.category_id = $${params.length}`; }
  query += ' ORDER BY t.opened_at DESC';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function criar(req, res) {
  const { category_id, description, location, priority } = req.body;
  if (!category_id || !description)
    return res.status(400).json({ error: 'Categoria e descricao sao obrigatorios' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tickets (category_id, user_id, description, location, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category_id, req.user.id, description, location || null, priority || 'media']
    );
    const ticket = rows[0];

    // Busca nome da categoria para a mensagem
    const cat = await pool.query('SELECT name FROM ticket_categories WHERE id=$1', [category_id]);
    const catNome = cat.rows[0]?.name || 'Chamado';
    const icon = CATEGORIA_ICONS[catNome] || '📋';
    const prioLabel = priority === 'alta' ? '🔴 ALTA' : priority === 'baixa' ? '🟢 Baixa' : '🟡 Media';

    // Notifica grupo WhatsApp
    const msg = [
      `${icon} *Novo chamado de limpeza!*`,
      ``,
      `📍 *Local:* ${location || 'Nao informado'}`,
      `🏷 *Tipo:* ${catNome}`,
      `⚡ *Prioridade:* ${prioLabel}`,
      `📝 *Descricao:* ${description}`,
      `👤 *Solicitado por:* ${req.user.name}`,
    ].join('\n');

    await notificarGrupoLimpeza(msg);
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const validos = ['aberto', 'em_andamento', 'resolvido', 'cancelado'];
  if (!validos.includes(status))
    return res.status(400).json({ error: 'Status invalido' });
  try {
    const { rows } = await pool.query(
      `UPDATE tickets SET status=$1, assigned_to=$2,
       started_at = CASE WHEN $1='em_andamento' THEN NOW() ELSE started_at END,
       closed_at  = CASE WHEN $1='resolvido'    THEN NOW() ELSE NULL END
       WHERE id=$3 RETURNING *`,
      [status, req.user.id, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Chamado nao encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function avaliar(req, res) {
  const { id } = req.params;
  const { rating, rating_note } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Avaliacao deve ser entre 1 e 5' });
  try {
    const { rows } = await pool.query(
      `UPDATE tickets SET rating=$1, rating_note=$2 WHERE id=$3 AND user_id=$4 RETURNING *`,
      [rating, rating_note || null, id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Chamado nao encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function categorias(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM ticket_categories WHERE active=true ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listar, criar, atualizarStatus, avaliar, categorias };
