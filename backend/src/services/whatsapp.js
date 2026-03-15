const axios = require('axios');

const EVOLUTION_URL      = process.env.EVOLUTION_URL      || '';
const EVOLUTION_APIKEY   = process.env.EVOLUTION_APIKEY   || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'mamba';
const GRUPO_LIMPEZA      = process.env.WHATSAPP_GRUPO_LIMPEZA || '';

async function notificarGrupoLimpeza(mensagem) {
  if (!EVOLUTION_URL || !GRUPO_LIMPEZA) {
    console.log('[WhatsApp] Nao configurado - mensagem:', mensagem);
    return;
  }
  try {
    await axios.post(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      { number: GRUPO_LIMPEZA, text: mensagem },
      { headers: { apikey: EVOLUTION_APIKEY } }
    );
    console.log('[WhatsApp] Mensagem enviada ao grupo');
  } catch (err) {
    console.error('[WhatsApp] Erro:', err.message);
  }
}

module.exports = { notificarGrupoLimpeza };
