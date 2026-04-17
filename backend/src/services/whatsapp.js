const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const GRUPO_LIMPEZA = process.env.WHATSAPP_GRUPO_LIMPEZA || '';
const SESSION_NAME = 'mamba-session';

let qrCodeData = null;
let isReady = false;

// ─── Store PostgreSQL para RemoteAuth ─────────────────────────
class PgStore {
  async sessionExists({ session }) {
    const { rows } = await pool.query(
      'SELECT id FROM whatsapp_sessions WHERE session_name=$1', [session]
    );
    return rows.length > 0;
  }

  async save({ session }) {
    const zipPath = `./${session}.zip`;
    if (!fs.existsSync(zipPath)) return;
    const data = fs.readFileSync(zipPath).toString('base64');
    await pool.query(
      `INSERT INTO whatsapp_sessions (session_name, session_data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (session_name) DO UPDATE SET session_data=$2, updated_at=NOW()`,
      [session, data]
    );
    console.log('[WhatsApp] Sessão salva no banco.');
  }

  async extract({ session, path: destPath }) {
    const { rows } = await pool.query(
      'SELECT session_data FROM whatsapp_sessions WHERE session_name=$1', [session]
    );
    if (!rows[0]) return;
    const zipBuffer = Buffer.from(rows[0].session_data, 'base64');
    const zipPath = `./${session}.zip`;
    fs.writeFileSync(zipPath, zipBuffer);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(destPath, true);
    fs.unlinkSync(zipPath);
    console.log('[WhatsApp] Sessão restaurada do banco.');
  }

  async delete({ session }) {
    await pool.query('DELETE FROM whatsapp_sessions WHERE session_name=$1', [session]);
  }
}

// ─── Cliente WhatsApp ──────────────────────────────────────────
const client = new Client({
  authStrategy: new RemoteAuth({
    store: new PgStore(),
    session: SESSION_NAME,
    backupSyncIntervalMs: 60000,
  }),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--safebrowsing-disable-auto-update',
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
  console.error('[WhatsApp] Falha na autenticação — reiniciando processo...');
  setTimeout(() => process.exit(1), 1000);
});

client.on('remote_session_saved', () => {
  console.log('[WhatsApp] Sessão sincronizada com o banco.');
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('[WhatsApp] Desconectado:', reason, '— reiniciando processo para reconexão limpa...');
  setTimeout(() => process.exit(1), 1000);
});

// Keepalive: evita timeout por inatividade no WhatsApp Web
setInterval(async () => {
  if (!isReady) return;
  try {
    await client.getState();
  } catch (err) {
    console.warn('[WhatsApp] Keepalive falhou:', err.message);
  }
}, 30000);

client.initialize().catch(err => {
  console.error('[WhatsApp] Erro ao inicializar:', err.message);
  setTimeout(() => process.exit(1), 1000);
});

// ─── Funções exportadas ────────────────────────────────────────
async function notificarGrupoLimpeza(mensagem) {
  if (!GRUPO_LIMPEZA) {
    console.log('[WhatsApp] WHATSAPP_GRUPO_LIMPEZA não configurado:', mensagem);
    return;
  }
  if (!isReady) {
    console.warn('[WhatsApp] Cliente não está pronto, mensagem descartada.');
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
