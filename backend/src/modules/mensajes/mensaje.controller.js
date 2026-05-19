// src/modules/mensajes/mensaje.controller.js
const { query } = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');
const logger = require('../../utils/logger');
const { emitNuevoMensaje } = require('../../socket/chat.socket');
const { sendPushNotification } = require('../../utils/pushNotification');

let _tableReady = false;
const ensureTable = async () => {
  if (_tableReady) return;

  const cols = await query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'mensajes'
      AND column_name  = 'destinatario_id'
  `);

  if (cols.length === 0) {
    logger.info('⚙️  Migrando tabla mensajes a chat directo...');
    await query('DROP TABLE IF EXISTS mensajes CASCADE');
    await query(`
      CREATE TABLE mensajes (
        id               SERIAL PRIMARY KEY,
        remitente_id     INTEGER NOT NULL REFERENCES usuarios(id),
        destinatario_id  INTEGER NOT NULL REFERENCES usuarios(id),
        contenido        TEXT,
        tipo             VARCHAR(10) NOT NULL DEFAULT 'texto',
        archivo_url      TEXT,
        leido            BOOLEAN DEFAULT FALSE,
        created_at       TIMESTAMP DEFAULT NOW()
      )
    `);
    await query(`
      CREATE INDEX idx_mensajes_conv ON mensajes(
        LEAST(remitente_id, destinatario_id),
        GREATEST(remitente_id, destinatario_id),
        created_at ASC
      )
    `);
    logger.info('✅ Tabla mensajes (chat directo) creada');
  } else {
    // Migración incremental: agregar columnas de media si no existen
    const tipoCol = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'mensajes' AND column_name = 'tipo'
    `);
    if (tipoCol.length === 0) {
      await query(`ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) NOT NULL DEFAULT 'texto'`);
      await query(`ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS archivo_url TEXT`);
      // contenido puede ser NULL cuando hay media
      await query(`ALTER TABLE mensajes ALTER COLUMN contenido DROP NOT NULL`);
      logger.info('✅ Columnas tipo y archivo_url agregadas a mensajes');
    }
  }

  _tableReady = true;
};

// GET /api/mensajes/conversaciones
const listarConversaciones = async (req, res) => {
  try {
    await ensureTable();
    const userId = req.user.id;

    const rows = await query(
      `WITH conv_msgs AS (
         SELECT
           CASE WHEN remitente_id = $1 THEN destinatario_id ELSE remitente_id END AS partner_id,
           id, contenido, tipo, created_at, leido, remitente_id
         FROM mensajes
         WHERE remitente_id = $1 OR destinatario_id = $1
       ),
       last_msg AS (
         SELECT DISTINCT ON (partner_id)
           partner_id, contenido AS ultimo_mensaje, tipo AS ultimo_tipo, created_at AS ultimo_mensaje_at
         FROM conv_msgs
         ORDER BY partner_id, created_at DESC
       ),
       unread AS (
         SELECT partner_id, COUNT(*)::int AS no_leidos
         FROM conv_msgs
         WHERE remitente_id <> $1 AND leido = FALSE
         GROUP BY partner_id
       )
       SELECT
         u.id            AS partner_id,
         u.nombre        AS partner_nombre,
         u.foto_perfil   AS partner_foto,
         CASE
           WHEN lm.ultimo_tipo = 'imagen' THEN '📷 Imagen'
           WHEN lm.ultimo_tipo = 'video'  THEN '🎥 Video'
           ELSE lm.ultimo_mensaje
         END             AS ultimo_mensaje,
         lm.ultimo_mensaje_at,
         COALESCE(ur.no_leidos, 0) AS no_leidos
       FROM last_msg lm
       JOIN usuarios u ON u.id = lm.partner_id
       LEFT JOIN unread ur ON ur.partner_id = lm.partner_id
       ORDER BY lm.ultimo_mensaje_at DESC`,
      [userId]
    );

    return successResponse(res, rows, 'Conversaciones obtenidas');
  } catch (error) {
    logger.error('❌ listarConversaciones:', error.message);
    return errorResponse(res, error.message, 500);
  }
};

// GET /api/mensajes/directo/:usuarioId
const listarDirecto = async (req, res) => {
  try {
    await ensureTable();
    const userId  = req.user.id;
    const otherId = parseInt(req.params.usuarioId, 10);

    if (!otherId || isNaN(otherId)) {
      return errorResponse(res, 'usuarioId inválido', 400);
    }

    const mensajes = await query(
      `SELECT m.id, m.remitente_id, m.destinatario_id,
              m.contenido, m.tipo, m.archivo_url, m.leido, m.created_at,
              u.nombre AS remitente_nombre, u.foto_perfil AS remitente_foto
       FROM mensajes m
       JOIN usuarios u ON u.id = m.remitente_id
       WHERE (m.remitente_id = $1 AND m.destinatario_id = $2)
          OR (m.remitente_id = $2 AND m.destinatario_id = $1)
       ORDER BY m.created_at ASC`,
      [userId, otherId]
    );

    await query(
      `UPDATE mensajes SET leido = TRUE
       WHERE remitente_id = $2 AND destinatario_id = $1 AND leido = FALSE`,
      [userId, otherId]
    );

    return successResponse(res, mensajes, 'Mensajes obtenidos');
  } catch (error) {
    logger.error('❌ listarDirecto:', error.message);
    return errorResponse(res, error.message, 500);
  }
};

// POST /api/mensajes  (texto)
const enviar = async (req, res) => {
  try {
    await ensureTable();
    const { destinatario_id, contenido } = req.body;
    const userId = req.user.id;

    if (!destinatario_id || !contenido?.trim()) {
      return errorResponse(res, 'destinatario_id y contenido son requeridos', 400);
    }

    if (typeof contenido !== 'string' || contenido.trim().length > 5000) {
      return errorResponse(res, 'El mensaje supera el límite de 5000 caracteres', 400);
    }

    const destIdInt = parseInt(destinatario_id, 10);
    if (isNaN(destIdInt) || destIdInt === userId) {
      return errorResponse(res, 'destinatario_id inválido', 400);
    }

    const dest = await query('SELECT id FROM usuarios WHERE id = $1', [destIdInt]);
    if (!dest.length) return errorResponse(res, 'Destinatario no encontrado', 404);

    const result = await query(
      `INSERT INTO mensajes (remitente_id, destinatario_id, contenido, tipo)
       VALUES ($1, $2, $3, 'texto')
       RETURNING id, remitente_id, destinatario_id, contenido, tipo, archivo_url, leido, created_at`,
      [userId, destIdInt, contenido.trim()]
    );

    const mensaje = result[0];

    const [sender, recipient] = await Promise.all([
      query('SELECT nombre, foto_perfil FROM usuarios WHERE id = $1', [userId]),
      query('SELECT expo_push_token FROM usuarios WHERE id = $1', [destIdInt]),
    ]);

    mensaje.remitente_nombre = sender[0]?.nombre;
    mensaje.remitente_foto   = sender[0]?.foto_perfil;

    emitNuevoMensaje(userId, destIdInt, mensaje);

    const pushToken = recipient[0]?.expo_push_token;
    const preview   = contenido.trim().length > 60
      ? contenido.trim().slice(0, 60) + '…'
      : contenido.trim();
    sendPushNotification(pushToken, {
      title: sender[0]?.nombre || 'Nuevo mensaje',
      body:  preview,
      data:  { screen: 'Chat', destinatarioId: userId, nombre: sender[0]?.nombre },
    });

    return successResponse(res, mensaje, 'Mensaje enviado', 201);
  } catch (error) {
    logger.error('❌ enviarMensaje:', error.message);
    return errorResponse(res, error.message, 500);
  }
};

// POST /api/mensajes/media  (imagen o video vía Cloudinary)
const enviarMedia = async (req, res) => {
  try {
    await ensureTable();
    const { destinatario_id } = req.body;
    const userId = req.user.id;

    if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);
    if (!destinatario_id) return errorResponse(res, 'destinatario_id es requerido', 400);

    const destIdInt = parseInt(destinatario_id, 10);
    if (isNaN(destIdInt) || destIdInt === userId) {
      return errorResponse(res, 'destinatario_id inválido', 400);
    }

    const dest = await query('SELECT id FROM usuarios WHERE id = $1', [destIdInt]);
    if (!dest.length) return errorResponse(res, 'Destinatario no encontrado', 404);

    const archivo_url = req.file.path; // URL de Cloudinary
    const isVideo     = req.file.mimetype?.startsWith('video/');
    const tipo        = isVideo ? 'video' : 'imagen';
    const contenido   = isVideo ? '[Video]' : '[Imagen]';

    const result = await query(
      `INSERT INTO mensajes (remitente_id, destinatario_id, contenido, tipo, archivo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, remitente_id, destinatario_id, contenido, tipo, archivo_url, leido, created_at`,
      [userId, destIdInt, contenido, tipo, archivo_url]
    );

    const mensaje = result[0];

    const [sender, recipient] = await Promise.all([
      query('SELECT nombre, foto_perfil FROM usuarios WHERE id = $1', [userId]),
      query('SELECT expo_push_token FROM usuarios WHERE id = $1', [destIdInt]),
    ]);

    mensaje.remitente_nombre = sender[0]?.nombre;
    mensaje.remitente_foto   = sender[0]?.foto_perfil;

    emitNuevoMensaje(userId, destIdInt, mensaje);

    sendPushNotification(recipient[0]?.expo_push_token, {
      title: sender[0]?.nombre || 'Nuevo mensaje',
      body:  isVideo ? '🎥 Te envió un video' : '📷 Te envió una imagen',
      data:  { screen: 'Chat', destinatarioId: userId, nombre: sender[0]?.nombre },
    });

    return successResponse(res, mensaje, 'Archivo enviado', 201);
  } catch (error) {
    logger.error('❌ enviarMedia:', error.message);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { listarConversaciones, listarDirecto, enviar, enviarMedia };
