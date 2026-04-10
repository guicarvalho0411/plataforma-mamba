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

app.get('/whatsapp/qrcode', async (req, res) => {
  const { getQRCodeImage, getStatus } = require('./services/whatsapp');
  if (getStatus()) return res.send('<h2>✅ WhatsApp conectado!</h2>');
  const img = await getQRCodeImage();
  if (!img) return res.send('<h2>Aguardando QR Code... Atualize a página em alguns segundos.</h2>');
  res.send(`<h2>Escaneie o QR Code com o WhatsApp</h2><img src="${img}" />`);
});

app.get('/whatsapp/anunciar', async (req, res) => {
  const { notificarGrupoLimpeza, getStatus } = require('./services/whatsapp');
  if (!getStatus()) return res.send('<h2>⚠️ WhatsApp não conectado. Aguarde e tente novamente.</h2>');
  await notificarGrupoLimpeza(
    `📅 *Nova funcionalidade ativada!*\n\n` +
    `A partir de agora, todo dia às *13h* você receberá aqui um resumo com todas as reuniões com clientes agendadas para o dia.\n\n` +
    `Além disso, reuniões que passarem do dia são arquivadas automaticamente como *realizadas*.\n\n` +
    `Nenhuma reunião será esquecida! 🧹✅`
  );
  res.send('<h2>✅ Anúncio enviado no grupo!</h2>');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await criarTabelaLembretes();
  iniciarCron();
});
