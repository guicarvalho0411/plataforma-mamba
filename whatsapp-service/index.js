require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { notificarGrupoLimpeza, getQRCodeImage, getStatus } = require('./whatsapp');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.WHATSAPP_SERVICE_KEY || '';

// Middleware de autenticação (exceto QR e status)
function auth(req, res, next) {
  if (!API_KEY) return next(); // sem key configurada, aceita tudo (dev)
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Envia mensagem para o grupo
app.post('/send', auth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message é obrigatório' });
  await notificarGrupoLimpeza(message);
  res.json({ ok: true });
});

// Status da conexão
app.get('/status', (req, res) => {
  res.json({ connected: getStatus() });
});

// QR Code para conectar
app.get('/qrcode', async (req, res) => {
  if (getStatus()) return res.send('<h2>✅ WhatsApp conectado!</h2>');
  const img = await getQRCodeImage();
  if (!img) return res.send('<h2>⏳ Aguardando QR Code... Atualize em alguns segundos.</h2>');
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px">
    <h2>📱 Escaneie o QR Code com o WhatsApp</h2>
    <img src="${img}" style="max-width:300px"/>
    <p>Após escanear, esta página mostrará ✅</p>
    <script>setTimeout(()=>location.reload(),10000)</script>
  </body></html>`);
});

app.get('/', (req, res) => res.json({ status: 'WhatsApp Service rodando!', connected: getStatus() }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ WhatsApp Service rodando na porta ${PORT}`);
});
