// src/modules/pedidos/pedido.service.js
const pedidoRepository     = require('./pedido.repository');
const { AppError }         = require('../../utils/errors');
const ESTADOS              = require('../../constants/estados');
const notifService         = require('../notificaciones/notificacion.service');
const lagunaRepository     = require('../lagunas/laguna.repository');

const ESTADO_MENSAJES = {
  pendiente:   { titulo: 'Pedido recibido',       msg: id => `Tu pedido #${id} está pendiente de aceptación por el productor.` },
  aceptado:    { titulo: 'Pedido aceptado',        msg: id => `¡El productor aceptó tu pedido #${id}! Está siendo preparado.` },
  preparando:  { titulo: 'Pedido en preparación',  msg: id => `Tu pedido #${id} está siendo preparado.` },
  pesado:      { titulo: 'Pedido pesado',           msg: id => `Tu pedido #${id} fue pesado. Revisa el precio final y confírmalo.` },
  en_camino:   { titulo: 'Pedido en camino',        msg: id => `¡Tu pedido #${id} está en camino! Prepárate para recibirlo.` },
  entregado:   { titulo: 'Pedido entregado',        msg: id => `¡Tu pedido #${id} fue entregado! ¡Disfrútalo!` },
  cancelado:   { titulo: 'Pedido cancelado',        msg: id => `Tu pedido #${id} fue cancelado.` },
};
const {
  sendPushNotification,
  notificarPesado,
  notificarPrecioExpirado,
} = require('../../services/pushNotifications');
const { emitPedidoActualizado } = require('../../socket/chat.socket');

class PedidoService {

  async obtenerPedidosUsuario(usuarioId) {
    try {
      await pedidoRepository.cancelarExpirados();
      return await pedidoRepository.findByUsuario(usuarioId);
    } catch (error) {
      throw new AppError('Error al obtener pedidos', 500);
    }
  }

  async obtenerPedidosRecientes(usuarioId) {
    try {
      await pedidoRepository.cancelarExpirados();
      return await pedidoRepository.findRecientesByUsuario(usuarioId);
    } catch (error) {
      throw new AppError('Error al obtener pedidos recientes', 500);
    }
  }

  async obtenerPedidosRecibidos(productorId) {
    try {
      await pedidoRepository.cancelarExpirados();
      return await pedidoRepository.findRecibidosByProductor(productorId);
    } catch (error) {
      throw new AppError('Error al obtener pedidos recibidos', 500);
    }
  }

  async obtenerPedidoPorId(pedidoId, usuarioId, rol) {
    try {
      const pedido = await pedidoRepository.findById(pedidoId);
      if (!pedido) throw new AppError('Pedido no encontrado', 404);
      if (rol === 'admin') return pedido;
      if (rol === 'consumidor' && pedido.consumidor_id === usuarioId) return pedido;
      if (rol === 'productor') {
        const itemsProductor = (pedido.items || []).filter(i => i.productor_id === usuarioId);
        if (!itemsProductor.length) throw new AppError('No tienes permiso para ver este pedido', 403);
        return { ...pedido, items: itemsProductor };
      }
      if (rol === 'repartidor' && pedido.repartidor_id === usuarioId) return pedido;
      throw new AppError('No tienes permiso para ver este pedido', 403);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener pedido', 500);
    }
  }

  async crearPedido(pedidoData) {
    try {
      if (!pedidoData.items || pedidoData.items.length === 0)
        throw new AppError('El pedido debe contener al menos un producto', 400);
      return await pedidoRepository.create(pedidoData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear pedido', 500);
    }
  }

  async actualizarEstado(pedidoId, nuevoEstado, usuarioId, rol) {
    try {
      const estadoNormalizado = this.normalizarEstado(nuevoEstado);

      if (!ESTADOS.ESTADOS_PEDIDO_LISTA.includes(estadoNormalizado))
        throw new AppError(
          `Estado no válido: "${estadoNormalizado}". Permitidos: ${ESTADOS.ESTADOS_PEDIDO_LISTA.join(', ')}`,
          400
        );

      if (rol !== 'productor')
        throw new AppError('Solo los productores pueden actualizar el estado de los pedidos', 403);

      const pedido = await pedidoRepository.updateEstado(pedidoId, estadoNormalizado);
      if (!pedido) throw new AppError('Pedido no encontrado', 404);

      // Auto-descuento de laguna al entregar
      if (estadoNormalizado === 'entregado') {
        this._descontarDeLaguna(pedidoId).catch(e =>
          console.error('[laguna-deduccion] Error no bloqueante:', e.message)
        );
      }

      // Notify consumer in real time
      if (pedido.consumidor_id) {
        emitPedidoActualizado(pedido.consumidor_id, {
          id:     pedido.id,
          estado: estadoNormalizado,
        });

        const info = ESTADO_MENSAJES[estadoNormalizado];
        if (info) {
          notifService.crear({
            usuario_id: pedido.consumidor_id,
            titulo: info.titulo,
            mensaje: info.msg(pedidoId),
            tipo: 'pedido',
            data: { pedido_id: pedidoId, estado: estadoNormalizado },
          });
        }
      }

      return pedido;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar estado del pedido', 500);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ NUEVO: Productor registra el peso POR ITEM del pedido
  // ═══════════════════════════════════════════════════════════════
  // items[] = [
  //   { detalle_id, cantidad_pescados, peso_real_kg }
  // ]
  //
  // Valida:
  //   - El productor sea quien pesa
  //   - Haya al menos 1 item
  //   - Cada item tenga cantidad ≥ 1 y peso > 0
  //   - El peso promedio por pescado sea ≥ 800g (por item)
  async registrarPesoItems(pedidoId, items, rol) {
    try {
      if (rol !== 'productor')
        throw new AppError('Solo el productor puede registrar el peso', 403);

      if (!Array.isArray(items) || items.length === 0)
        throw new AppError('Debes enviar al menos un item con peso', 400);

      // Validar cada item
      for (const item of items) {
        if (!item.detalle_id)
          throw new AppError('Cada item debe tener detalle_id', 400);

        const cantidad = parseInt(item.cantidad_pescados);
        const peso     = parseFloat(item.peso_real_kg);

        if (!cantidad || cantidad < 1)
          throw new AppError(`Cantidad inválida en item ${item.detalle_id}`, 400);
        if (!peso || peso <= 0)
          throw new AppError(`Peso inválido en item ${item.detalle_id}`, 400);
      }

      // Registrar en BD
      const pedido = await pedidoRepository.registrarPesoItems(pedidoId, items);

      if (!pedido)
        throw new AppError(
          'No se pudo registrar el peso. El pedido no existe o no está en estado "preparando" o "pesado".',
          400
        );

      const minutosConf = pedido.minutos_aplicados || ESTADOS.MINUTOS_CONFIRMACION;

      // Notificar al consumidor
      if (pedido.consumidor_push_token) {
        const precioFinal = parseFloat(pedido.precio_final).toFixed(2);
        await sendPushNotification(
          pedido.consumidor_push_token,
          '⚖️ ¡Tu pedido fue pesado!',
          `${pedido.cantidad_pescados} pescado(s) pesaron ${parseFloat(pedido.peso_real_kg).toFixed(2)} kg — Total: Bs. ${precioFinal}. Tienes ${minutosConf} min para confirmar.`,
          {
            type:             'pesado',
            pedidoId,
            precioFinal,
            pesoRealKg:       pedido.peso_real_kg,
            cantidadPescados: pedido.cantidad_pescados,
            screen:           'MisPedidos',
          }
        );
      }

      if (pedido.consumidor_id) {
        notifService.crear({
          usuario_id: pedido.consumidor_id,
          titulo: 'Pedido pesado',
          mensaje: `Tu pedido #${pedidoId} fue pesado (${parseFloat(pedido.peso_real_kg).toFixed(2)} kg). Tienes ${minutosConf} min para confirmar el precio.`,
          tipo: 'pedido',
          data: { pedido_id: pedidoId, estado: 'pesado' },
        });
      }

      return {
        ...pedido,
        minutos_para_confirmar: minutosConf,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al registrar el peso', 500);
    }
  }

  // ✅ LEGADO: método global (se mantiene por compatibilidad pero ya no se recomienda)
  async registrarPeso(pedidoId, cantidadPescados, pesoRealKg, rol) {
    try {
      if (rol !== 'productor')
        throw new AppError('Solo el productor puede registrar el peso', 403);

      if (!cantidadPescados || cantidadPescados < 1)
        throw new AppError('La cantidad de pescados debe ser al menos 1', 400);

      if (!pesoRealKg || pesoRealKg <= 0)
        throw new AppError('El peso debe ser mayor a 0 kg', 400);

      const pesoPromedio = (pesoRealKg * 1000) / cantidadPescados;
      if (pesoPromedio < ESTADOS.PESO_MINIMO_GRAMOS) {
        throw new AppError(
          `El peso promedio por pescado (${pesoPromedio.toFixed(0)}g) es menor al mínimo permitido (${ESTADOS.PESO_MINIMO_GRAMOS}g)`,
          400
        );
      }

      const pedido = await pedidoRepository.registrarPeso(pedidoId, cantidadPescados, pesoRealKg);

      if (!pedido)
        throw new AppError('No se pudo registrar el peso.', 400);

      if (pedido.consumidor_push_token) {
        const precioFinal = parseFloat(pedido.precio_final).toFixed(2);
        await sendPushNotification(
          pedido.consumidor_push_token,
          '⚖️ ¡Tu pedido fue pesado!',
          `${cantidadPescados} pescado(s) pesaron ${pesoRealKg} kg — Total: Bs. ${precioFinal}.`,
          { type: 'pesado', pedidoId, precioFinal, pesoRealKg, cantidadPescados, screen: 'MisPedidos' }
        );
      }

      return { ...pedido, minutos_para_confirmar: pedido.minutos_aplicados || ESTADOS.MINUTOS_CONFIRMACION };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al registrar el peso', 500);
    }
  }

  async confirmarPrecio(pedidoId, consumidorId) {
    try {
      const pedido = await pedidoRepository.confirmarPrecio(pedidoId, consumidorId);
      if (!pedido)
        throw new AppError(
          'No se pudo confirmar. El pedido no existe, no te pertenece, ya expiró o no está esperando confirmación.',
          400
        );
      return pedido;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al confirmar el precio', 500);
    }
  }

  async rechazarPrecio(pedidoId, consumidorId) {
    try {
      const pedido = await pedidoRepository.rechazarPrecio(pedidoId, consumidorId);
      if (!pedido)
        throw new AppError(
          'No se pudo rechazar. El pedido no existe, no te pertenece o no está esperando confirmación.',
          400
        );
      return pedido;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al rechazar el precio', 500);
    }
  }

  async obtenerHistorial(usuarioId, filtros) {
    try {
      await pedidoRepository.cancelarExpirados();
      return await pedidoRepository.findHistorial(usuarioId, filtros);
    } catch (error) {
      throw new AppError('Error al obtener historial de pedidos', 500);
    }
  }

  async obtenerTodosPedidos() {
    try {
      await pedidoRepository.cancelarExpirados();
      return await pedidoRepository.findAll();
    } catch (error) {
      throw new AppError('Error al obtener todos los pedidos', 500);
    }
  }

  normalizarEstado(estado) {
    return estado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  async subirComprobante(pedidoId, consumidorId, fileUrl) {
    try {
      const pedido = await pedidoRepository.updateComprobante(pedidoId, consumidorId, fileUrl);
      if (!pedido)
        throw new AppError('Pedido no encontrado o no te pertenece.', 404);

      const productorToken = await pedidoRepository.findProductorPushToken(pedidoId);
      if (productorToken) {
        sendPushNotification(
          productorToken,
          '📸 Comprobante de pago recibido',
          `El cliente subió el comprobante QR del pedido #${pedidoId}. Verifícalo y confirma el pago.`,
          { type: 'comprobante_qr', pedidoId, screen: 'Pedidos' }
        ).catch(() => {});
      }

      return pedido;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al subir comprobante', 500);
    }
  }

  async statsConsumidor(usuarioId) {
    try {
      return await pedidoRepository.statsConsumidor(usuarioId);
    } catch (error) {
      throw new AppError('Error al obtener estad\u00edsticas', 500);
    }
  }

  async _descontarDeLaguna(pedidoId) {
    const pedido = await pedidoRepository.findById(pedidoId);
    if (!pedido?.items?.length) return;

    for (const item of pedido.items) {
      if (!item.laguna_id) continue;
      const siembra = await lagunaRepository.findSiembraActiva(item.laguna_id);
      if (!siembra) continue;

      const kgVendidos = parseFloat(item.peso_real_kg || item.cantidad || 0);
      if (kgVendidos <= 0) continue;

      const pesoActualKg = parseFloat(siembra.peso_objetivo_g || 800) / 1000;
      const pecesDescontados = Math.max(1, Math.round(kgVendidos / pesoActualKg));
      const nuevoPeces = Math.max(0, siembra.peces_actuales - pecesDescontados);

      await lagunaRepository.updateSiembra(siembra.id, { peces_actuales: nuevoPeces });
      await lagunaRepository.createMovimiento({
        siembra_id:  siembra.id,
        laguna_id:   item.laguna_id,
        tipo:        'venta',
        cantidad:    kgVendidos,
        unidad:      'kg',
        ingreso_bs:  parseFloat(item.precio_final || item.subtotal || 0),
        pedido_id:   pedidoId,
        descripcion: `Pedido #${pedidoId}`,
      });
    }
  }
}

module.exports = new PedidoService();