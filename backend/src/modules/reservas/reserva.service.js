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

// Peso promedio por pescado para estimar (modo 'cantidad'). Sincronizado con la app.
const PESO_PROMEDIO_KG = 0.9;
const PESO_MIN_KG = 0.8;

class ReservaService {

  async crear({ consumidor_id, productor_id, producto_id, cantidad, items, fecha_reserva, hora_reserva, es_cocinado, notas }) {
    if (!productor_id) throw new AppError('productor_id requerido', 400);
    if (!fecha_reserva) throw new AppError('fecha_reserva requerida (YYYY-MM-DD)', 400);

    // Validar fecha futura (o hoy)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(`${fecha_reserva}T00:00:00`);
    if (fecha < hoy) throw new AppError('La fecha de reserva no puede ser pasada', 400);

    // Validar disponibilidad del productor
    const disponible = await disponibilidadService.puedeReservarFecha(productor_id, fecha_reserva);
    if (!disponible) throw new AppError('El productor no acepta reservas para esa fecha', 400);

    const expires_at = new Date(Date.now() + HORAS_VIGENCIA * 60 * 60 * 1000);

    // ── NUEVO: reserva multi-ítem (desde el carrito) ──────────────────
    if (Array.isArray(items) && items.length > 0) {
      const reserva = await this._crearConItems({
        consumidor_id, productor_id, fecha_reserva, hora_reserva,
        es_cocinado, notas, expires_at, items,
      });
      this._notificarNueva(reserva, productor_id, consumidor_id, fecha_reserva, items.length);
      return { ...reserva, items: await repo.getItems(reserva.id) };
    }

    // ── Compat: reserva de un solo producto ──────────────────────────
    if (!cantidad || parseFloat(cantidad) <= 0) throw new AppError('cantidad inválida', 400);

    // Calcular precio estimado si hay producto
    let precio_estimado = null;
    if (producto_id) {
      const prod = await db.query(`SELECT precio FROM productos WHERE id = $1 AND productor_id = $2`,
        [producto_id, productor_id]);
      if (prod.length === 0) throw new AppError('Producto no pertenece al productor', 400);
      precio_estimado = parseFloat((parseFloat(prod[0].precio) * parseFloat(cantidad) * PESO_PROMEDIO_KG).toFixed(2));
    }

    const codigo = await repo.generarCodigoUnico();
    const reserva = await repo.create({
      consumidor_id, productor_id, producto_id, cantidad,
      fecha_reserva, hora_reserva, es_cocinado, notas,
      precio_estimado, expires_at, codigo,
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

  // Valida productos, calcula estimados y crea reserva multi-ítem
  async _crearConItems({ consumidor_id, productor_id, fecha_reserva, hora_reserva, es_cocinado, notas, expires_at, items }) {
    const norm = [];
    let total = 0;
    for (const it of items) {
      const pid = it.producto_id;
      if (!pid) throw new AppError('Ítem sin producto_id', 400);
      const prod = await db.query(`SELECT precio FROM productos WHERE id = $1 AND productor_id = $2`, [pid, productor_id]);
      if (prod.length === 0) throw new AppError(`El producto ${pid} no pertenece a este productor`, 400);
      const precioKg = parseFloat(prod[0].precio) || 0;
      const modo = it.modo === 'peso' ? 'peso' : 'cantidad';
      let estimado = 0, cantidad = 0, peso = null;
      if (modo === 'peso') {
        peso = parseFloat(it.peso_solicitado_kg) || 0;
        if (peso < PESO_MIN_KG) throw new AppError(`El mínimo es ${PESO_MIN_KG} kg por producto (un pescado)`, 400);
        estimado = peso * precioKg;
      } else {
        cantidad = Math.max(1, Math.ceil(parseFloat(it.cantidad) || 0));
        estimado = cantidad * PESO_PROMEDIO_KG * precioKg;
      }
      estimado = parseFloat(estimado.toFixed(2));
      total += estimado;
      norm.push({ producto_id: pid, modo, cantidad, peso_solicitado_kg: peso, precio_estimado: estimado });
    }
    total = parseFloat(total.toFixed(2));
    return repo.createConItems({
      consumidor_id, productor_id, fecha_reserva, hora_reserva,
      es_cocinado, notas, precio_estimado: total, expires_at, items: norm,
    });
  }

  // Notificación in-app + push al productor por nueva reserva
  _notificarNueva(reserva, productor_id, consumidor_id, fecha_reserva, numItems) {
    notifService.crear({
      usuario_id: productor_id,
      titulo: 'Nueva reserva',
      mensaje: `Tienes una nueva reserva (${numItems} producto${numItems !== 1 ? 's' : ''}) para el ${fecha_reserva}`,
      tipo: 'reserva',
      data: { reserva_id: reserva.id, codigo: reserva.codigo },
    }).catch(e => logger.warn('Notif reserva error', { error: e.message }));

    (async () => {
      try {
        const token = await getPushToken(productor_id);
        if (!token) return;
        const datos = await db.query(`SELECT nombre AS consumidor_nombre FROM usuarios WHERE id = $1`, [consumidor_id]);
        await push.notificarNuevaReserva(token, reserva.id, datos[0]?.consumidor_nombre || 'Un cliente', numItems, null, fecha_reserva);
      } catch (e) { logger.warn('Push reserva error', { error: e.message }); }
    })();
  }

  // Adjunta los reserva_items a cada reserva de la lista (batch)
  // Resiliente: si la tabla reserva_items aún no existe (migración pendiente),
  // devuelve las reservas sin items en lugar de fallar con 500.
  async _attachItems(reservas) {
    try {
      const ids = reservas.map(r => r.id);
      const items = await repo.getItemsForReservas(ids);
      const porReserva = {};
      for (const it of items) {
        (porReserva[it.reserva_id] = porReserva[it.reserva_id] || []).push(it);
      }
      return reservas.map(r => ({ ...r, items: porReserva[r.id] || [] }));
    } catch (e) {
      logger.warn('No se pudieron adjuntar reserva_items (¿migración pendiente?)', { error: e.message });
      return reservas.map(r => ({ ...r, items: [] }));
    }
  }

  async listarMisReservas(usuario) {
    const data = usuario.rol === 'productor'
      ? await repo.findByProductor(usuario.id)
      : await repo.findByConsumidor(usuario.id);
    return this._attachItems(data);
  }

  async listarPorEstado(usuario, estado) {
    const data = usuario.rol === 'productor'
      ? await repo.findByProductor(usuario.id, { estado })
      : await repo.findByConsumidor(usuario.id, { estado });
    return this._attachItems(data);
  }

  async detalle(id, usuario) {
    const r = await repo.findById(id);
    if (!r) throw new AppError('Reserva no encontrada', 404);
    if (usuario.rol !== 'admin' &&
        r.consumidor_id !== usuario.id &&
        r.productor_id  !== usuario.id) {
      throw new AppError('Sin permisos para ver esta reserva', 403);
    }
    try { r.items = await repo.getItems(id); } catch { r.items = []; }
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
