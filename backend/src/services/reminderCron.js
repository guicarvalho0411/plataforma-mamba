const cron = require('node-cron');
const pool = require('../db');
const { notificarGrupoLimpeza } = require('./whatsapp');

async function criarTabelaLembretes() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meeting_reminders (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER NOT NULL,
      remind_at TIMESTAMPTZ NOT NULL,
      sent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ Tabela meeting_reminders pronta');
}

async function agendarLembreteBanco(meetingId, meeting_date, start_time) {
  try {
    // Usa offset explícito -03:00 (BRT) para não depender da timezone do servidor
    const dataReuniao = new Date(`${meeting_date}T${start_time.slice(0, 5)}:00-03:00`);
    const remindAt = new Date(dataReuniao.getTime() - 15 * 60 * 1000);

    if (remindAt <= new Date()) return; // já passou

    await pool.query(
      `INSERT INTO meeting_reminders (meeting_id, remind_at) VALUES ($1, $2)`,
      [meetingId, remindAt]
    );
    console.log(`✅ Lembrete agendado no banco para ${remindAt.toISOString()}`);
  } catch (err) {
    console.error('[reminderCron] Erro ao salvar lembrete:', err.message);
  }
}

function iniciarCron() {
  // ── 1. Lembrete 15min antes (verifica a cada minuto) ───────────
  cron.schedule('* * * * *', async () => {
    try {
      const { rows } = await pool.query(`
        SELECT r.id, r.meeting_id,
               cm.client_name, cm.client_company,
               cm.start_time, cm.attendees AS room_name
        FROM meeting_reminders r
        JOIN client_meetings cm ON cm.id = r.meeting_id
        WHERE r.sent = false
          AND r.remind_at <= NOW()
      `);

      for (const r of rows) {
        const msg = [
          `⏰ *Lembrete: reunião em 15 minutos!*`,
          ``,
          `👤 *Cliente:* ${r.client_name}${r.client_company ? ` (${r.client_company})` : ''}`,
          `🕐 *Horário:* ${r.start_time?.slice(0, 5)}`,
          r.room_name ? `🚪 *Sala:* ${r.room_name}` : '',
          ``,
          `Prepare o espaço agora! 🧹`,
        ].filter(Boolean).join('\n');

        await notificarGrupoLimpeza(msg, true);
        await pool.query(`UPDATE meeting_reminders SET sent = true WHERE id = $1`, [r.id]);
        console.log(`✅ Lembrete enviado para reunião ${r.meeting_id}`);
      }
    } catch (err) {
      console.error('[reminderCron] Erro ao processar lembretes:', err.message);
    }
  });

  // ── 2. Resumo diário às 13h (horário de Brasília) ───────────────
  cron.schedule('0 13 * * *', async () => {
    try {
      const { rows } = await pool.query(`
        SELECT cm.client_name, cm.client_company, cm.start_time, cm.attendees AS room_name
        FROM client_meetings cm
        WHERE cm.meeting_date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
          AND cm.status = 'agendado'
        ORDER BY cm.start_time
      `);

      const hoje = new Date().toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long', day: '2-digit', month: '2-digit'
      });

      if (rows.length === 0) {
        await notificarGrupoLimpeza(
          `📅 *Reuniões de hoje — ${hoje}*\n\nNenhuma reunião agendada para hoje! ✅`
        );
        return;
      }

      const linhas = rows.map((r, i) => {
        const nome = r.client_name + (r.client_company ? ` (${r.client_company})` : '');
        const sala = r.room_name ? ` | 🚪 ${r.room_name}` : '';
        return `${i + 1}. *${nome}*\n   🕐 ${r.start_time?.slice(0, 5)}${sala}`;
      });

      const msg = [
        `📅 *Reuniões de hoje — ${hoje}*`,
        ``,
        ...linhas,
        ``,
        `Total: ${rows.length} reunião(ões) hoje`,
      ].join('\n');

      await notificarGrupoLimpeza(msg);
      console.log(`✅ Resumo diário enviado (${rows.length} reuniões)`);
    } catch (err) {
      console.error('[reminderCron] Erro ao enviar resumo diário:', err.message);
    }
  }, { timezone: 'America/Sao_Paulo' });

  // ── 3. Arquivar reuniões passadas à meia-noite (BRT) ───────────
  cron.schedule('0 0 * * *', async () => {
    try {
      const { rowCount } = await pool.query(`
        UPDATE client_meetings
        SET status = 'realizado'
        WHERE meeting_date < (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
          AND status = 'agendado'
      `);
      if (rowCount > 0) {
        console.log(`✅ ${rowCount} reunião(ões) arquivadas automaticamente`);
      }
    } catch (err) {
      console.error('[reminderCron] Erro ao arquivar reuniões:', err.message);
    }
  }, { timezone: 'America/Sao_Paulo' });

  console.log('✅ Crons iniciados: lembrete 15min | resumo 13h | arquivar meia-noite');
}

module.exports = { criarTabelaLembretes, agendarLembreteBanco, iniciarCron };
