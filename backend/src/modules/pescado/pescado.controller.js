// src/modules/pescado/pescado.controller.js
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB decoded

const MAGIC_BYTES = {
  'image/jpeg': ['ffd8ff'],
  'image/png':  ['89504e47'],
  'image/webp': ['52494646'],
};

const validarMagicBytes = (base64, mediaType) => {
  const expected = MAGIC_BYTES[mediaType];
  if (!expected) return false;
  try {
    const head = Buffer.from(base64.slice(0, 12), 'base64').toString('hex').toLowerCase();
    return expected.some(prefix => head.startsWith(prefix));
  } catch {
    return false;
  }
};

const SYSTEM_FRESCURA = `Eres un inspector experto en inocuidad alimentaria especializado en pescado. Tu análisis debe ser RIGUROSO y CONSERVADOR — en caso de duda, el resultado debe ser negativo para proteger la salud del consumidor.

Evalúa CADA indicador de forma crítica e independiente:

OJOS (peso: 30%):
- Fresco: completamente claros, transparentes, abultados y brillantes
- No fresco: cualquier opacidad, hundimiento, color grisáceo o apagado

AGALLAS (peso: 30%, si visibles):
- Fresco: rojo vivo o rosado brillante, húmedas
- No fresco: marrón, grisáceo, oscuro, viscosas

ESCAMAS Y PIEL (peso: 25%):
- Fresco: brillantes, bien adheridas, piel húmeda con lustre
- No fresco: opacas, secas, sueltas, manchas, decoloración

ASPECTO GENERAL (peso: 15%):
- Fresco: firme, húmedo, postura natural
- No fresco: blando, seco, mucosidad excesiva, mal color

REGLAS ESTRICTAS:
- Si los ojos están opacos o hundidos → fresco: false, puntaje máximo 40
- Si las agallas son marrones/grises → fresco: false, puntaje máximo 45
- Solo marca fresco: true si la MAYORÍA de indicadores son claramente positivos
- NO te dejes influenciar por el hecho de que el pescado esté en hielo o en un mercado
- Sé honesto aunque el resultado sea negativo — la salud del usuario importa más

Responde SOLO con JSON válido:
{
  "fresco": true,
  "confianza": "alta",
  "puntaje": 85,
  "indicadores": {
    "ojos": "descripción objetiva",
    "escamas": "descripción objetiva",
    "piel": "descripción objetiva",
    "agallas": "descripción objetiva o 'no visibles'"
  },
  "veredicto": "Descripción honesta del estado del pescado.",
  "recomendacion": "Qué debe hacer el consumidor."
}

Si la imagen no muestra claramente un pescado, establece fresco como null.`;

const analizarFrescura = async (req, res) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body;

    if (!imageBase64)
      return res.status(400).json({ success: false, message: 'Se requiere la imagen en base64.' });

    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposValidos.includes(mediaType))
      return res.status(400).json({ success: false, message: 'Tipo de imagen no soportado.' });

    const decodedSize = Math.floor(imageBase64.length * 3 / 4);
    if (decodedSize > MAX_IMAGE_BYTES)
      return res.status(413).json({
        success: false,
        message: `La imagen supera el tamaño máximo permitido (${MAX_IMAGE_BYTES / 1024 / 1024} MB).`,
      });

    if (!validarMagicBytes(imageBase64, mediaType))
      return res.status(400).json({
        success: false,
        message: 'El contenido del archivo no coincide con el tipo de imagen declarado.',
      });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      // Prompt caching: system es estático y largo → se cachea (ephemeral 5 min) y abarata ~75% el segundo análisis en adelante.
      system: [
        { type: 'text', text: SYSTEM_FRESCURA, cache_control: { type: 'ephemeral' } },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Analiza este pescado y determina si está fresco. Responde solo con el JSON.',
            },
          ],
        },
      ],
    });

    const texto = response.content[0]?.text || '';

    let analisis;
    try {
      const match = texto.match(/\{[\s\S]*\}/);
      analisis = JSON.parse(match ? match[0] : texto);
    } catch {
      analisis = {
        fresco: null,
        confianza: 'baja',
        puntaje: 0,
        indicadores: { ojos: '-', escamas: '-', piel: '-', agallas: '-' },
        veredicto: texto || 'No se pudo analizar la imagen.',
        recomendacion: 'Intenta con una foto más clara y bien iluminada.',
      };
    }

    return res.json({ success: true, data: analisis });

  } catch (error) {
    logger.logError('analizarFrescura failed', error, { status: error.status });
    return res.status(500).json({
      success: false,
      message: 'No se pudo analizar la imagen en este momento.',
    });
  }
};

module.exports = { analizarFrescura };
