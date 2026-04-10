/**
 * Corrige os remind_at de lembretes não enviados que foram salvos com timezone errado.
 * Executa uma única vez.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/db');

async function main() {
  const { rows } = await pool.query(`
    SELECT r.id, cm.meeting_date, cm.start_time
    FROM meeting_reminders r
    JOIN client_meetings cm ON cm.id = r.meeting_id
    WHERE r.sent = false
  `);

  if (rows.length === 0) {
    console.log('Nenhum lembrete pendente para corrigir.');
    process.exit(0);
  }

  console.log(`Corrigindo ${rows.length} lembrete(s)...`);

  for (const row of rows) {
    const dateStr = row.meeting_date instanceof Date
      ? row.meeting_date.toISOString().split('T')[0]
      : String(row.meeting_date).split('T')[0];
    const timeStr = String(row.start_time).slice(0, 5);

    // Interpreta horário como BRT (UTC-3)
    const dataReuniao = new Date(`${dateStr}T${timeStr}:00-03:00`);
    const remindAt = new Date(dataReuniao.getTime() - 15 * 60 * 1000);

    await pool.query(
      `UPDATE meeting_reminders SET remind_at = $1 WHERE id = $2`,
      [remindAt, row.id]
    );

    console.log(`  ID ${row.id}: remind_at → ${remindAt.toISOString()} (${dateStr} ${timeStr} BRT - 15min)`);
  }

  console.log('Concluído.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
