// opinion.controller.js
const { query } = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');
const { sendPushNotification } = require('../../utils/pushNotification');

// Add response columns if they don't exist yet
query(
  `ALTER TABLE opiniones
     ADD COLUMN IF NOT EXISTS respuesta TEXT,
     ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ`
).catch(() => {});

const crear = async (req, res) => {
  try {
    const { id: usuario_id } = req.user;
    const { producto_id, calificacion, comentario } = req.body;

    if (!producto_id || !calificacion) {
      return errorResponse(res, 'producto_id y calificacion son requeridos', 400);
    }
    if (calificacion < 1 || calificacion > 5) {
      return errorResponse(res, 'La calificación debe ser entre 1 y 5', 400);
    }

    // Verificar que el producto existe
    const producto = await query('SELECT id FROM productos WHERE id = $1', [producto_id]);
    if (!producto[0]) return errorResponse(res, 'Producto no encontrado', 404);

    // Solo se puede reseñar si el usuario tiene al menos un pedido entregado con este producto
    const compra = await query(
      `SELECT 1 FROM pedidos p
       JOIN detalles_pedido dp ON dp.pedido_id = p.id
       WHERE p.consumidor_id = $1
         AND dp.producto_id  = $2
         AND p.estado        = 'entregado'
       LIMIT 1`,
      [usuario_id, producto_id]
    );
    if (!compra[0]) {
      return errorResponse(res, 'Solo puedes reseñar productos que hayas comprado', 403);
    }

    // Insertar opinión (upsert: una opinión por usuario/producto)
    const result = await query(
      `INSERT INTO opiniones (producto_id, usuario_id, calificacion, comentario)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (producto_id, usuario_id)
       DO UPDATE SET calificacion = $3, comentario = $4, fecha = NOW()
       RETURNING *`,
      [producto_id, usuario_id, calificacion, comentario || null]
    );

    // Notificar al productor del producto (fire-and-forget)
    query(
      `SELECT pr.nombre AS producto_nombre,
              u.expo_push_token,
              rev.nombre AS revisor_nombre
       FROM productos pr
       JOIN usuarios u   ON u.id  = pr.productor_id
       JOIN usuarios rev ON rev.id = $2
       WHERE pr.id = $1`,
      [producto_id, usuario_id]
    ).then(rows => {
      if (!rows[0]?.expo_push_token) return;
      const { producto_nombre, expo_push_token, revisor_nombre } = rows[0];
      const stars = '⭐'.repeat(calificacion);
      sendPushNotification(expo_push_token, {
        title: `${stars} Nueva reseña`,
        body:  `${revisor_nombre} calificó "${producto_nombre}" con ${calificacion} estrella${calificacion !== 1 ? 's' : ''}`,
        data:  { type: 'nueva_resena', producto_id },
      });
    }).catch(() => {});

    return successResponse(res, result[0], 'Opinión guardada correctamente', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const listarPorProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const result = await query(
      `SELECT o.id, o.calificacion, o.comentario, o.fecha,
              o.respuesta, o.fecha_respuesta,
              u.nombre AS usuario_nombre, u.foto_perfil
       FROM opiniones o
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE o.producto_id = $1
       ORDER BY o.fecha DESC`,
      [producto_id]
    );
    return successResponse(res, result, 'Opiniones obtenidas');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const listarPorProductor = async (req, res) => {
  try {
    const { productor_id } = req.params;
    const result = await query(
      `SELECT o.id, o.calificacion, o.comentario, o.fecha,
              o.respuesta, o.fecha_respuesta,
              u.nombre AS usuario_nombre, u.foto_perfil,
              p.nombre AS producto_nombre, p.id AS producto_id
       FROM opiniones o
       JOIN usuarios u  ON u.id  = o.usuario_id
       JOIN productos p ON p.id  = o.producto_id
       WHERE p.productor_id = $1
       ORDER BY o.fecha DESC`,
      [productor_id]
    );
    return successResponse(res, result, 'Opiniones obtenidas');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const responder = async (req, res) => {
  try {
    const { id: usuario_id } = req.user;
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta?.trim()) {
      return errorResponse(res, 'La respuesta no puede estar vacía', 400);
    }

    // Verify the authenticated user is the producer who owns this product
    const check = await query(
      `SELECT o.id FROM opiniones o
       JOIN productos p ON p.id = o.producto_id
       WHERE o.id = $1 AND p.productor_id = $2`,
      [id, usuario_id]
    );
    if (!check[0]) {
      return errorResponse(res, 'No autorizado o reseña no encontrada', 403);
    }

    const result = await query(
      `UPDATE opiniones
       SET respuesta = $1, fecha_respuesta = NOW()
       WHERE id = $2
       RETURNING *`,
      [respuesta.trim(), id]
    );
    return successResponse(res, result[0], 'Respuesta publicada');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { crear, listarPorProducto, listarPorProductor, responder };
