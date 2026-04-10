const express = require('express');
const cors    = require('cors');
require('dotenv').config();
const { criarTabelaLembretes, iniciarCron } = require('./services/reminderCron');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/tickets',        require('./routes/tickets'));
app.use('/api/schedules',      require('./routes/schedules'));
app.use('/api/rooms',          require('./routes/rooms'));
app.use('/api/cleaners',       require('./routes/cleaners'));
app.use('/api/client-meetings',require('./routes/clientMeetings'));
app.use('/api/stock',          require('./routes/stock'));

app.get('/', (req, res) => res.json({ status: 'Servidor rodando!' }));

// QR Code e status do WhatsApp estão no whatsapp-service (serviço separado no Railway)
app.get('/whatsapp/status', async (req, res) => {
  const WA_URL = process.env.WHATSAPP_SERVICE_URL;
  if (!WA_URL) return res.json({ connected: false, note: 'WHATSAPP_SERVICE_URL não configurado' });
  try {
    const { data } = await require('axios').get(`${WA_URL}/status`, { timeout: 5000 });
    res.json(data);
  } catch { res.json({ connected: false }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await criarTabelaLembretes();
  iniciarCron();
});
