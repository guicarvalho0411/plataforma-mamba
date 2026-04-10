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
    const [ano, mes, dia] = meeting_date.split('-').map(Number);
    const [hora, min] = start_time.slice(0, 5).split(':').map(Number);
    const dataReuniao = new Date(ano, mes - 1, dia, hora, min, 0);
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
  // Roda a cada minuto
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

        await notificarGrupoLimpeza(msg);
        await pool.query(`UPDATE meeting_reminders SET sent = true WHERE id = $1`, [r.id]);
        console.log(`✅ Lembrete enviado para reunião ${r.meeting_id}`);
      }
    } catch (err) {
      console.error('[reminderCron] Erro ao processar lembretes:', err.message);
    }
  });

  console.log('✅ Cron de lembretes iniciado (verifica a cada minuto)');
}

module.exports = { criarTabelaLembretes, agendarLembreteBanco, iniciarCron };
