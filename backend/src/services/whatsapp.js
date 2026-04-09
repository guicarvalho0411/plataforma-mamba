const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const GRUPO_LIMPEZA = process.env.WHATSAPP_GRUPO_LIMPEZA || '';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
  console.log('\n[WhatsApp] Escaneie o QR Code abaixo com seu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('[WhatsApp] Conectado com sucesso!');
});

client.on('auth_failure', () => {
  console.error('[WhatsApp] Falha na autenticação. Delete a pasta .wwebjs_auth e reinicie.');
});

client.on('disconnected', (reason) => {
  console.warn('[WhatsApp] Desconectado:', reason);
});

client.initialize();

async function notificarGrupoLimpeza(mensagem) {
  if (!GRUPO_LIMPEZA) {
    console.log('[WhatsApp] WHATSAPP_GRUPO_LIMPEZA não configurado - mensagem:', mensagem);
    return;
  }
  try {
    await client.sendMessage(GRUPO_LIMPEZA, mensagem);
    console.log('[WhatsApp] Mensagem enviada ao grupo');
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err.message);
  }
}

module.exports = { notificarGrupoLimpeza };
