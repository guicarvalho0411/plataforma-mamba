require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Padrão de escalas
// dias: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
const COLABORADORAS = [
  { name: 'Julika', dias: [1,2,3,4,5], start: '06:00', end: '16:00', endSex: '15:00' },
  { name: 'Lu',     dias: [1,2,3,4,5], start: '07:00', end: '17:00', endSex: '16:00' },
  { name: 'Ale',    dias: [1,2,3,4,5], start: '11:00', end: '21:00', endSex: '20:00' },
  { name: 'Elis',   dias: [2,3,4,5,6], start: '10:00', end: '20:00', endSex: '19:00' },
];

// Gera datas para as próximas 12 semanas
function gerarDatas() {
  const hoje = new Date();
  const datas = [];
  for (let i = 0; i < 84; i++) { // 12 semanas = 84 dias
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    datas.push(d);
  }
  return datas;
}

async function seed() {
  console.log('🚀 Iniciando seed de escalas...\n');

  // 1. Inserir colaboradoras
  const ids = {};
  for (const c of COLABORADORAS) {
    // Verifica se já existe
    const existing = await pool.query(`SELECT id FROM cleaners WHERE name=$1`, [c.name]);
    let id;
    if (existing.rows.length > 0) {
      id = existing.rows[0].id;
      await pool.query(`UPDATE cleaners SET active=true WHERE id=$1`, [id]);
    } else {
      const { rows } = await pool.query(
        `INSERT INTO cleaners (name, type, active) VALUES ($1, 'fixa', true) RETURNING id`,
        [c.name]
      );
      id = rows[0].id;
    }
    ids[c.name] = id;
    console.log(`✅ Colaboradora: ${c.name} (id: ${id})`);
  }

  // 2. Inserir escalas
  const datas = gerarDatas();
  let count = 0;

  for (const data of datas) {
    const diaSemana = data.getDay(); // 0=Dom, 1=Seg... 6=Sáb
    const dateStr = data.toISOString().split('T')[0];
    const isSexta = diaSemana === 5;

    for (const c of COLABORADORAS) {
      if (!c.dias.includes(diaSemana)) continue;

      const fim = isSexta ? c.endSex : c.end;

      await pool.query(
        `INSERT INTO schedules (cleaner_id, date, shift_start, shift_end, type)
         VALUES ($1, $2, $3, $4, 'turno')
         ON CONFLICT (cleaner_id, date) DO NOTHING`,
        [ids[c.name], dateStr, c.start, fim]
      );
      count++;
    }
  }

  console.log(`\n✅ ${count} escalas inseridas para as próximas 12 semanas!`);
  await pool.end();
}

seed().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
