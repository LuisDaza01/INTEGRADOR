// carrito.service.js - Lógica de negocio para Carrito
const carritoRepository = require('./carrito.repository');
const { AppError } = require('../../utils/errors');

class CarritoService {
  /**
   * Obtener carrito del usuario
   */
  async obtenerCarrito(usuarioId) {
    try {
      const items = await carritoRepository.findByUsuario(usuarioId);
      const total = await carritoRepository.calcularTotal(usuarioId);
      
      return {
        items,
        total,
        cantidad_items: items.length
      };
    } catch (error) {
      throw new AppError('Error al obtener carrito', 500);
    }
  }

  /**
   * Agregar producto al carrito
   */
  async agregarProducto(usuarioId, productoId, cantidad = 1) {
    try {
      // Verificar si el producto ya está en el carrito
      const itemExistente = await carritoRepository.findItemByProducto(usuarioId, productoId);

      if (itemExistente) {
        // Si existe, incrementar cantidad
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        await carritoRepository.updateCantidad(itemExistente.id, nuevaCantidad, usuarioId);
      } else {
        // Si no existe, crear nuevo item
        await carritoRepository.create(usuarioId, productoId, cantidad);
      }

      return await this.obtenerCarrito(usuarioId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al agregar producto al carrito', 500);
    }
  }

  /**
   * Actualizar cantidad de un item
   */
  async actualizarCantidad(itemId, cantidad, usuarioId) {
    try {
      if (cantidad < 1) {
        throw new AppError('La cantidad debe ser al menos 1', 400);
      }

      // Verificar que el item pertenece al usuario
      const perteneceAlUsuario = await carritoRepository.verificarPropietario(itemId, usuarioId);
      if (!perteneceAlUsuario) {
        throw new AppError('Item no encontrado en tu carrito', 404);
      }

      const item = await carritoRepository.updateCantidad(itemId, cantidad, usuarioId);
      
      if (!item) {
        throw new AppError('Item no encontrado', 404);
      }

      return await this.obtenerCarrito(usuarioId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar cantidad', 500);
    }
  }

  /**
   * Eliminar producto del carrito
   */
  async eliminarProducto(itemId, usuarioId) {
    try {
      // Verificar que el item pertenece al usuario
      const perteneceAlUsuario = await carritoRepository.verificarPropietario(itemId, usuarioId);
      if (!perteneceAlUsuario) {
        throw new AppError('Item no encontrado en tu carrito', 404);
      }

      const item = await carritoRepository.delete(itemId, usuarioId);
      
      if (!item) {
        throw new AppError('Item no encontrado', 404);
      }

      return await this.obtenerCarrito(usuarioId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar producto del carrito', 500);
    }
  }

  /**
   * Limpiar todo el carrito
   */
  async limpiarCarrito(usuarioId) {
    try {
      await carritoRepository.limpiar(usuarioId);
      return {
        items: [],
        total: 0,
        cantidad_items: 0
      };
    } catch (error) {
      throw new AppError('Error al limpiar carrito', 500);
    }
  }

  /**
   * Migrar carrito anónimo (cuando el usuario inicia sesión)
   */
  async migrarCarrito(usuarioId, itemsAnonimos) {
    try {
      for (const item of itemsAnonimos) {
        await this.agregarProducto(usuarioId, item.producto_id, item.cantidad);
      }

      return await this.obtenerCarrito(usuarioId);
    } catch (error) {
      throw new AppError('Error al migrar carrito', 500);
    }
  }
}

module.exports = new CarritoService();