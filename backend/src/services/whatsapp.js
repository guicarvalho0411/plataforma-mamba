// O WhatsApp agora roda em serviço separado.
// Este módulo é apenas um cliente HTTP que chama o whatsapp-service.
const axios = require('axios');

const WA_URL = process.env.WHATSAPP_SERVICE_URL || '';
const WA_KEY = process.env.WHATSAPP_SERVICE_KEY || '';

async function notificarGrupoLimpeza(mensagem) {
  if (!WA_URL) {
    console.log('[WhatsApp] WHATSAPP_SERVICE_URL não configurado. Mensagem:', mensagem);
    return;
  }
  try {
    await axios.post(`${WA_URL}/send`, { message: mensagem }, {
      headers: { 'x-api-key': WA_KEY },
      timeout: 10000,
    });
    console.log('[WhatsApp] Mensagem enviada via serviço');
  } catch (err) {
    console.error('[WhatsApp] Erro ao chamar whatsapp-service:', err.message);
  }
}

module.exports = { notificarGrupoLimpeza };
