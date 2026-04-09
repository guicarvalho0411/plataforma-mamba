const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

const GRUPO_LIMPEZA = process.env.WHATSAPP_GRUPO_LIMPEZA || '';

let qrCodeData = null;
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

client.on('qr', (qr) => {
  qrCodeData = qr;
  isReady = false;
  console.log('\n[WhatsApp] QR Code gerado. Acesse /whatsapp/qrcode no navegador.\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  qrCodeData = null;
  isReady = true;
  console.log('[WhatsApp] Conectado com sucesso!');
});

client.on('auth_failure', () => {
  console.error('[WhatsApp] Falha na autenticação.');
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('[WhatsApp] Desconectado:', reason);
  client.initialize();
});

client.initialize();

async function notificarGrupoLimpeza(mensagem) {
  if (!GRUPO_LIMPEZA) {
    console.log('[WhatsApp] WHATSAPP_GRUPO_LIMPEZA não configurado:', mensagem);
    return;
  }
  try {
    await client.sendMessage(GRUPO_LIMPEZA, mensagem);
    console.log('[WhatsApp] Mensagem enviada ao grupo');
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err.message);
  }
}

async function getQRCodeImage() {
  if (!qrCodeData) return null;
  return await QRCode.toDataURL(qrCodeData);
}

function getStatus() { return isReady; }

module.exports = { notificarGrupoLimpeza, getQRCodeImage, getStatus };
