// src/modules/inventario/inventario.service.js
const repo = require('./inventario.repository');
const db   = require('../../config/database');
const { AppError } = require('../../utils/errors');

class InventarioService {

  // El productor reporta una venta presencial / ajuste / merma manualmente.
  // Solo permitimos los tipos que tienen sentido como acción humana.
  async registrarManual({ productor_id, producto_id, tipo, cantidad, descripcion }) {
    const TIPOS_MANUALES = ['alta', 'venta_offline', 'ajuste', 'merma'];
    if (!TIPOS_MANUALES.includes(tipo))
      throw new AppError(`Tipo no permitido manualmente: ${tipo}`, 400);

    // Verificar que el producto pertenezca al productor
    const dueño = await db.query(
      `SELECT id FROM productos WHERE id = $1 AND productor_id = $2`,
      [producto_id, productor_id]
    );
    if (dueño.length === 0)
      throw new AppError('Producto no encontrado o no pertenece al productor', 404);

    try {
      const r = await repo.crearMovimiento({
        producto_id, productor_id, tipo, cantidad,
        descripcion: descripcion || null,
      });
      return r;
    } catch (e) {
      if (e.message?.startsWith('Stock insuficiente')) {
        throw new AppError(e.message, 400);
      }
      throw new AppError(e.message || 'Error al registrar movimiento', 500);
    }
  }

  async historialPorProducto(producto_id, opts) {
    return repo.findByProducto(producto_id, opts);
  }

  async historialPorProductor(productor_id, opts) {
    return repo.findByProductor(productor_id, opts);
  }

  async resumenProductor(productor_id) {
    return repo.resumenStockProductor(productor_id);
  }

  // Helpers internos invocados por pedido.service en transacciones existentes
  // (reciben `tx` para integrarse con la transacción del pedido)
  async descontarPorPedido({ pedido_id, items, tx }) {
    for (const it of items) {
      if (!it.producto_id || !it.cantidad) continue;
      const productoRows = await tx.query(
        `SELECT productor_id FROM productos WHERE id = $1`,
        [it.producto_id]
      );
      if (productoRows.length === 0) continue;
      await repo.crearMovimiento({
        producto_id:  it.producto_id,
        productor_id: productoRows[0].productor_id,
        tipo:         'venta_online',
        cantidad:     it.cantidad,
        pedido_id,
        descripcion:  `Pedido #${pedido_id}`,
        tx,
      });
    }
  }

  async devolverPorPedido({ pedido_id, items, tx }) {
    for (const it of items) {
      if (!it.producto_id || !it.cantidad) continue;
      const productoRows = await tx.query(
        `SELECT productor_id FROM productos WHERE id = $1`,
        [it.producto_id]
      );
      if (productoRows.length === 0) continue;
      await repo.crearMovimiento({
        producto_id:  it.producto_id,
        productor_id: productoRows[0].productor_id,
        tipo:         'devolucion',
        cantidad:     it.cantidad,
        pedido_id,
        descripcion:  `Cancelación pedido #${pedido_id}`,
        tx,
      });
    }
  }
}

module.exports = new InventarioService();
