// src/modules/reservas/reserva.service.js
const repo                  = require('./reserva.repository');
const disponibilidadService = require('../disponibilidad/disponibilidad.service');
const pedidoRepository      = require('../pedidos/pedido.repository');
const db                    = require('../../config/database');
const notifService          = require('../notificaciones/notificacion.service');
const push                  = require('../../services/pushNotifications');
const { AppError }          = require('../../utils/errors');
const logger                = require('../../utils/logger');

// Helper: leer push token de un usuario
const getPushToken = async (usuarioId) => {
  const rows = await db.query(`SELECT expo_push_token FROM usuarios WHERE id = $1`, [usuarioId]);
  return rows[0]?.expo_push_token || null;
};

const HORAS_VIGENCIA = repo.HORAS_VIGENCIA_DEFAULT;

class ReservaService {

  async crear({ consumidor_id, productor_id, producto_id, cantidad, fecha_reserva, hora_reserva, es_cocinado, notas }) {
    if (!productor_id) throw new AppError('productor_id requerido', 400);
    if (!cantidad || parseFloat(cantidad) <= 0) throw new AppError('cantidad inválida', 400);
    if (!fecha_reserva) throw new AppError('fecha_reserva requerida (YYYY-MM-DD)', 400);

    // Validar fecha futura (o hoy)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(`${fecha_reserva}T00:00:00`);
    if (fecha < hoy) throw new AppError('La fecha de reserva no puede ser pasada', 400);

    // Validar disponibilidad del productor
    const disponible = await disponibilidadService.puedeReservarFecha(productor_id, fecha_reserva);
    if (!disponible) throw new AppError('El productor no acepta reservas para esa fecha', 400);

    // Calcular precio estimado si hay producto
    let precio_estimado = null;
    if (producto_id) {
      const prod = await db.query(`SELECT precio FROM productos WHERE id = $1 AND productor_id = $2`,
        [producto_id, productor_id]);
      if (prod.length === 0) throw new AppError('Producto no pertenece al productor', 400);
      precio_estimado = parseFloat((parseFloat(prod[0].precio) * parseFloat(cantidad)).toFixed(2));
    }

    const expires_at = new Date(Date.now() + HORAS_VIGENCIA * 60 * 60 * 1000);

    const reserva = await repo.create({
      consumidor_id, productor_id, producto_id, cantidad,
      fecha_reserva, hora_reserva, es_cocinado, notas,
      precio_estimado, expires_at,
    });

    // Notif in-app (registro en BD)
    notifService.crear({
      usuario_id: productor_id,
      titulo: 'Nueva reserva',
      mensaje: `Tienes una nueva reserva para el ${fecha_reserva}`,
      tipo: 'reserva',
      data: { reserva_id: reserva.id },
    }).catch(e => logger.warn('Notif reserva error', { error: e.message }));

    // Push al productor (best-effort)
    (async () => {
      try {
        const token = await getPushToken(productor_id);
        if (!token) return;
        const datos = await db.query(
          `SELECT u.nombre AS consumidor_nombre, p.nombre AS producto_nombre
           FROM usuarios u
           LEFT JOIN productos p ON p.id = $1
           WHERE u.id = $2`,
          [producto_id || null, consumidor_id]
        );
        await push.notificarNuevaReserva(
          token, reserva.id,
          datos[0]?.consumidor_nombre || 'Un cliente',
          cantidad,
          datos[0]?.producto_nombre,
          fecha_reserva,
        );
      } catch (e) { logger.warn('Push reserva error', { error: e.message }); }
    })();

    return reserva;
  }

  async listarMisReservas(usuario) {
    if (usuario.rol === 'productor') {
      return repo.findByProductor(usuario.id);
    }
    return repo.findByConsumidor(usuario.id);
  }

  async listarPorEstado(usuario, estado) {
    if (usuario.rol === 'productor') return repo.findByProductor(usuario.id, { estado });
    return repo.findByConsumidor(usuario.id, { estado });
  }

  async detalle(id, usuario) {
    const r = await repo.findById(id);
    if (!r) throw new AppError('Reserva no encontrada', 404);
    if (usuario.rol !== 'admin' &&
        r.consumidor_id !== usuario.id &&
        r.productor_id  !== usuario.id) {
      throw new AppError('Sin permisos para ver esta reserva', 403);
    }
    return r;
  }

  async aceptar(id, productor_id) {
    const result = await repo.transicionar({ id, productor_id, nuevoEstado: 'aceptada' });
    if (!result)                          throw new AppError('Reserva no encontrada', 404);
    if (result.error === 'no_owner')      throw new AppError('No es tu reserva', 403);
    if (result.error === 'estado_invalido') {
      throw new AppError(`No se puede aceptar (estado actual: ${result.estado})`, 400);
    }

    // Crear pedido enlazado automáticamente (best-effort: si falla por stock,
    // la reserva queda aceptada igual y el productor lo gestiona manual).
    let pedidoCreado = null;
    try {
      pedidoCreado = await pedidoRepository.createFromReserva(id);
    } catch (e) {
      logger.warn('createFromReserva falló', { reservaId: id, error: e.message });
    }

    // Notificar al consumidor (in-app + push)
    notifService.crear({
      usuario_id: result.reserva.consumidor_id,
      titulo: 'Reserva aceptada',
      mensaje: pedidoCreado
        ? `El productor aceptó tu reserva. Pedido #${pedidoCreado.id} creado.`
        : `El productor aceptó tu reserva para el ${result.reserva.fecha_reserva}.`,
      tipo: 'reserva',
      data: { reserva_id: id, estado: 'aceptada', pedido_id: pedidoCreado?.id || null },
    }).catch(() => {});

    (async () => {
      try {
        const [token, prodInfo] = await Promise.all([
          getPushToken(result.reserva.consumidor_id),
          db.query(`SELECT nombre FROM usuarios WHERE id = $1`, [productor_id]),
        ]);
        if (token) {
          await push.notificarReservaAceptada(
            token, id,
            prodInfo[0]?.nombre,
            result.reserva.fecha_reserva,
          );
        }
      } catch (e) { logger.warn('Push aceptada error', { error: e.message }); }
    })();

    return { ...result.reserva, pedido: pedidoCreado };
  }

  async rechazar(id, productor_id, motivo) {
    const result = await repo.transicionar({
      id, productor_id, nuevoEstado: 'rechazada', motivo_rechazo: motivo,
    });
    if (!result)                          throw new AppError('Reserva no encontrada', 404);
    if (result.error === 'no_owner')      throw new AppError('No es tu reserva', 403);
    if (result.error === 'estado_invalido') {
      throw new AppError(`No se puede rechazar (estado actual: ${result.estado})`, 400);
    }

    notifService.crear({
      usuario_id: result.reserva.consumidor_id,
      titulo: 'Reserva rechazada',
      mensaje: motivo
        ? `Tu reserva fue rechazada: ${motivo}`
        : 'Tu reserva fue rechazada por el productor.',
      tipo: 'reserva',
      data: { reserva_id: id, estado: 'rechazada' },
    }).catch(() => {});

    (async () => {
      try {
        const token = await getPushToken(result.reserva.consumidor_id);
        if (token) await push.notificarReservaRechazada(token, id, motivo);
      } catch (e) { logger.warn('Push rechazada error', { error: e.message }); }
    })();

    return result.reserva;
  }

  async cancelar(id, consumidor_id) {
    const result = await repo.cancelarPorConsumidor(id, consumidor_id);
    if (!result)                          throw new AppError('Reserva no encontrada', 404);
    if (result.error === 'no_owner')      throw new AppError('No es tu reserva', 403);
    if (result.error === 'estado_invalido') {
      throw new AppError(`No se puede cancelar (estado: ${result.estado})`, 400);
    }
    return result.reserva;
  }

  async expirarVencidas() {
    const expiradas = await repo.expirarVencidas();
    for (const r of expiradas) {
      notifService.crear({
        usuario_id: r.consumidor_id,
        titulo: 'Reserva expirada',
        mensaje: 'El productor no respondió a tiempo y tu reserva expiró.',
        tipo: 'reserva',
        data: { reserva_id: r.id, estado: 'expirada' },
      }).catch(() => {});

      (async () => {
        try {
          const token = await getPushToken(r.consumidor_id);
          if (token) await push.notificarReservaExpirada(token, r.id);
        } catch (e) { logger.warn('Push expirada error', { error: e.message }); }
      })();
    }
    return expiradas;
  }
}

module.exports = new ReservaService();
