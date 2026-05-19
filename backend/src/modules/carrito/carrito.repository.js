// carrito.repository.js - Capa de acceso a datos para Carrito
const db = require("../../config/database");

class CarritoRepository {
  /**
   * Obtener carrito del usuario
   */
  async findByUsuario(usuarioId) {
    const query = `
      SELECT
        c.id,
        c.producto_id,
        c.cantidad,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen,
        p.stock,
        p.unidad,
        p.productor_id,
        u.nombre as productor_nombre,
        u.qr_pago_url as productor_qr_pago_url,
        (p.precio * c.cantidad) as subtotal
      FROM carrito_items c
      JOIN productos p ON c.producto_id = p.id
      LEFT JOIN usuarios u ON p.productor_id = u.id
      WHERE c.usuario_id = $1
    `;
    
    return await db.query(query, [usuarioId]);
  }

  /**
   * Buscar item específico en el carrito
   */
  async findItemByProducto(usuarioId, productoId) {
    const query = `
      SELECT id, cantidad 
      FROM carrito_items
      WHERE usuario_id = $1 AND producto_id = $2
    `;
    
    const result = await db.query(query, [usuarioId, productoId]);
    return result[0] || null;
  }

  /**
   * Agregar producto al carrito
   */
  async create(usuarioId, productoId, cantidad) {
    const query = `
      INSERT INTO carrito_items (usuario_id, producto_id, cantidad)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [usuarioId, productoId, cantidad]);
    return result[0];
  }

  /**
   * Actualizar cantidad de un item
   */
  async updateCantidad(itemId, cantidad, usuarioId) {
    const query = `
      UPDATE carrito_items
      SET cantidad = $1, fecha_agregado = NOW()
      WHERE id = $2 AND usuario_id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [cantidad, itemId, usuarioId]);
    return result[0] || null;
  }

  /**
   * Incrementar cantidad existente
   */
  async incrementarCantidad(itemId, cantidadAdicional) {
    const query = `
      UPDATE carrito_items
      SET cantidad = cantidad + $1, fecha_agregado = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [cantidadAdicional, itemId]);
    return result[0];
  }

  /**
   * Eliminar un item del carrito
   */
  async delete(itemId, usuarioId) {
    const query = `
      DELETE FROM carrito_items
      WHERE id = $1 AND usuario_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [itemId, usuarioId]);
    return result[0] || null;
  }

  /**
   * Limpiar todo el carrito del usuario
   */
  async limpiar(usuarioId) {
    const query = `DELETE FROM carrito_items WHERE usuario_id = $1`;
    await db.query(query, [usuarioId]);
    return true;
  }

  /**
   * Verificar si un item pertenece al usuario
   */
  async verificarPropietario(itemId, usuarioId) {
    const query = `SELECT id FROM carrito_items WHERE id = $1 AND usuario_id = $2`;
    const result = await db.query(query, [itemId, usuarioId]);
    return result.length > 0;
  }

  /**
   * Contar items en el carrito
   */
  async contarItems(usuarioId) {
    const query = `
      SELECT COUNT(*) as total
      FROM carrito_items
      WHERE usuario_id = $1
    `;
    
    const result = await db.query(query, [usuarioId]);
    return parseInt(result[0].total);
  }

  /**
   * Calcular total del carrito
   */
  async calcularTotal(usuarioId) {
    const query = `
      SELECT 
        COALESCE(SUM(p.precio * c.cantidad), 0) as total
      FROM carrito_items c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = $1
    `;
    
    const result = await db.query(query, [usuarioId]);
    return parseFloat(result[0].total);
  }
}

module.exports = new CarritoRepository();