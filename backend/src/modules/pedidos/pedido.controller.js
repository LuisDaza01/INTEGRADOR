// src/modules/pedidos/pedido.controller.js
const pedidoService = require('./pedido.service');
const { successResponse, errorResponse } = require('../../utils/response');

class PedidoController {

  async obtenerPedidos(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const pedidos = await pedidoService.obtenerPedidosUsuario(usuarioId);
      return successResponse(res, pedidos, 'Pedidos obtenidos correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerPedidosRecientes(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const pedidos = await pedidoService.obtenerPedidosRecientes(usuarioId);
      return successResponse(res, pedidos, 'Pedidos recientes obtenidos');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerPedidosRecibidos(req, res) {
    try {
      const { id: productorId } = req.user;
      const pedidos = await pedidoService.obtenerPedidosRecibidos(productorId);
      return successResponse(res, pedidos, 'Pedidos recibidos obtenidos');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerPedidoPorId(req, res) {
    try {
      const { id } = req.params;
      const { id: usuarioId, rol } = req.user;
      const pedido = await pedidoService.obtenerPedidoPorId(id, usuarioId, rol);
      return successResponse(res, pedido, 'Pedido obtenido correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async crearPedido(req, res) {
    try {
      const { id: usuario_id } = req.user;
      const {
        direccion_id, direccion, metodo_pago_id, metodo_envio,
        items, notas, subtotal, costo_envio, total,
        parada_id, metodo_pago, comprobante_pago,
      } = req.body;

      const pedidoData = {
        usuario_id, direccion_id, direccion, metodo_pago_id,
        metodo_pago, metodo_envio, items, notas, subtotal,
        costo_envio, total, parada_id, comprobante_pago,
      };

      const pedido = await pedidoService.crearPedido(pedidoData);
      return successResponse(res, pedido, 'Pedido creado exitosamente', 201);
    } catch (error) {
      console.error('❌ Error crearPedido:', error.message);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { nuevoEstado } = req.body;
      const { id: usuarioId, rol } = req.user;
      const pedido = await pedidoService.actualizarEstado(id, nuevoEstado, usuarioId, rol);
      return successResponse(res, pedido, 'Estado del pedido actualizado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ NUEVO: Productor registra peso POR ITEM
  // PUT /api/pedidos/:id/pesar-items
  // Body: {
  //   items: [
  //     { detalle_id: 1, cantidad_pescados: 7, peso_real_kg: 6.28 },
  //     { detalle_id: 2, cantidad_pescados: 3, peso_real_kg: 2.50 }
  //   ]
  // }
  // ═══════════════════════════════════════════════════════════════
  async registrarPesoItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;
      const { rol } = req.user;

      const pedido = await pedidoService.registrarPesoItems(parseInt(id), items, rol);

      return successResponse(
        res,
        pedido,
        `Peso registrado. Total: Bs. ${parseFloat(pedido.precio_final).toFixed(2)}. El consumidor tiene ${pedido.minutos_para_confirmar} min para confirmar.`
      );
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // ✅ LEGADO: peso global del pedido
  // PUT /api/pedidos/:id/pesar
  async registrarPeso(req, res) {
    try {
      const { id } = req.params;
      const { cantidad_pescados, peso_real_kg } = req.body;
      const { rol } = req.user;

      const pedido = await pedidoService.registrarPeso(
        parseInt(id),
        parseInt(cantidad_pescados),
        parseFloat(peso_real_kg),
        rol
      );

      return successResponse(res, pedido, `Peso registrado. Total: Bs. ${parseFloat(pedido.precio_final).toFixed(2)}. El consumidor tiene ${pedido.minutos_para_confirmar} min para confirmar.`);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async confirmarPrecio(req, res) {
    try {
      const { id } = req.params;
      const { id: consumidorId } = req.user;
      const pedido = await pedidoService.confirmarPrecio(parseInt(id), consumidorId);
      return successResponse(res, pedido, '¡Precio confirmado! Tu pedido avanza a "Listo para recoger".');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async rechazarPrecio(req, res) {
    try {
      const { id } = req.params;
      const { id: consumidorId } = req.user;
      const pedido = await pedidoService.rechazarPrecio(parseInt(id), consumidorId);
      return successResponse(res, pedido, 'Pedido cancelado por rechazo de precio.');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerHistorial(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const { estado, fecha_desde, fecha_hasta } = req.query;
      const pedidos = await pedidoService.obtenerHistorial(usuarioId, { estado, fecha_desde, fecha_hasta });
      return successResponse(res, pedidos, 'Historial de pedidos obtenido');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async obtenerTodosPedidos(req, res) {
    try {
      const pedidos = await pedidoService.obtenerTodosPedidos();
      return successResponse(res, pedidos, 'Todos los pedidos obtenidos');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async subirComprobante(req, res) {
    try {
      const { id } = req.params;
      const { id: consumidorId } = req.user;
      const fileUrl = req.file?.path;
      if (!fileUrl) return errorResponse(res, 'No se recibió el archivo de comprobante', 400);
      const pedido = await pedidoService.subirComprobante(parseInt(id), consumidorId, fileUrl);
      return successResponse(res, pedido, 'Comprobante subido correctamente. El productor será notificado.');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async statsConsumidor(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const stats = await pedidoService.statsConsumidor(usuarioId);
      return successResponse(res, stats, 'Estadísticas obtenidas');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new PedidoController();