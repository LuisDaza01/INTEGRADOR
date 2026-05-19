// carrito.controller.js - Controlador para Carrito
const carritoService = require('./carrito.service');
const { successResponse, errorResponse } = require('../../utils/response');

class CarritoController {
  /**
   * Obtener carrito del usuario
   * GET /api/carrito
   */
  async obtenerCarrito(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const carrito = await carritoService.obtenerCarrito(usuarioId);
      return successResponse(res, carrito, 'Carrito obtenido correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Agregar producto al carrito
   * POST /api/carrito
   */
  async agregarProducto(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const { producto_id, cantidad = 1 } = req.body;

      const carrito = await carritoService.agregarProducto(usuarioId, producto_id, cantidad);
      return successResponse(res, carrito, 'Producto agregado al carrito');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Actualizar cantidad de un item
   * PUT /api/carrito/:id
   */
  async actualizarCantidad(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;
      const { id: usuarioId } = req.user;

      const carrito = await carritoService.actualizarCantidad(id, cantidad, usuarioId);
      return successResponse(res, carrito, 'Cantidad actualizada');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Eliminar producto del carrito
   * DELETE /api/carrito/:id
   */
  async eliminarProducto(req, res) {
    try {
      const { id } = req.params;
      const { id: usuarioId } = req.user;

      const carrito = await carritoService.eliminarProducto(id, usuarioId);
      return successResponse(res, carrito, 'Producto eliminado del carrito');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Limpiar carrito
   * DELETE /api/carrito/limpiar
   */
  async limpiarCarrito(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const carrito = await carritoService.limpiarCarrito(usuarioId);
      return successResponse(res, carrito, 'Carrito limpiado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Migrar carrito anónimo
   * POST /api/carrito/migrar
   */
  async migrarCarrito(req, res) {
    try {
      const { id: usuarioId } = req.user;
      const { items } = req.body;

      const carrito = await carritoService.migrarCarrito(usuarioId, items);
      return successResponse(res, carrito, 'Carrito migrado correctamente');
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new CarritoController();