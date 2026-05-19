// src/modules/inventario/inventario.repository.js
const db = require('../../config/database');

const TIPOS_VALIDOS = ['alta', 'venta_online', 'venta_offline', 'ajuste', 'merma', 'devolucion'];

class InventarioRepository {

  // Crea un movimiento y ajusta productos.stock dentro de la misma transacción.
  // `cantidad` es siempre positiva; el signo lo decide el `tipo`.
  async crearMovimiento({
    producto_id, productor_id, tipo, cantidad, unidad = 'unidades',
    pedido_id = null, descripcion = null, tx = null,
  }) {
    if (!TIPOS_VALIDOS.includes(tipo)) {
      throw new Error(`Tipo de movimiento inválido: ${tipo}`);
    }
    const cant = Math.abs(parseFloat(cantidad));
    if (!cant || cant <= 0) throw new Error('La cantidad debe ser > 0');

    // Tipos que SUMAN al stock (entradas) vs los que RESTAN
    const ENTRADAS = new Set(['alta', 'devolucion']);
    const delta = ENTRADAS.has(tipo) ? cant : -cant;

    const run = async (tx) => {
      // Lock fila del producto para evitar carreras
      const lock = await tx.query(
        `SELECT id, stock FROM productos WHERE id = $1 FOR UPDATE`,
        [producto_id]
      );
      if (lock.length === 0) throw new Error('Producto no existe');

      const stockActual = parseInt(lock[0].stock) || 0;
      const nuevoStock  = stockActual + delta;
      // Permitimos stock negativo solo en ajustes (errores de inventario detectados)
      if (nuevoStock < 0 && tipo !== 'ajuste') {
        throw new Error(`Stock insuficiente (disponible ${stockActual}, requerido ${cant})`);
      }

      await tx.query(
        `UPDATE productos SET stock = $1, fecha_actualizacion = NOW() WHERE id = $2`,
        [nuevoStock, producto_id]
      );

      const rows = await tx.query(
        `INSERT INTO inventario_movimientos
           (producto_id, productor_id, tipo, cantidad, unidad, pedido_id, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, producto_id, productor_id, tipo, cantidad, unidad, pedido_id, descripcion, fecha`,
        [producto_id, productor_id, tipo, delta, unidad, pedido_id, descripcion]
      );

      return { movimiento: rows[0], stock_resultante: nuevoStock };
    };

    return tx ? run(tx) : db.transaction(run);
  }

  async findByProducto(producto_id, { limit = 50, offset = 0 } = {}) {
    return db.query(
      `SELECT id, producto_id, productor_id, tipo, cantidad, unidad,
              pedido_id, descripcion, fecha
       FROM inventario_movimientos
       WHERE producto_id = $1
       ORDER BY fecha DESC
       LIMIT $2 OFFSET $3`,
      [producto_id, limit, offset]
    );
  }

  async findByProductor(productor_id, { limit = 100, offset = 0, tipo = null } = {}) {
    const params = [productor_id];
    let where = 'productor_id = $1';
    if (tipo) { params.push(tipo); where += ` AND tipo = $${params.length}`; }
    params.push(limit); params.push(offset);

    return db.query(
      `SELECT m.id, m.producto_id, m.tipo, m.cantidad, m.unidad,
              m.pedido_id, m.descripcion, m.fecha,
              p.nombre AS producto_nombre
       FROM inventario_movimientos m
       JOIN productos p ON p.id = m.producto_id
       WHERE ${where}
       ORDER BY m.fecha DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
  }

  async resumenStockProductor(productor_id) {
    return db.query(
      `SELECT
         p.id, p.nombre, p.descripcion, p.stock, p.precio, p.unidad,
         p.disponible, p.destacado, p.imagen, p.imagenes,
         p.categoria_id, c.nombre AS categoria_nombre, p.created_at,
         COALESCE(op.promedio, 0)     AS promedio_valoracion,
         COALESCE(op.total, 0)        AS total_valoraciones,
         COALESCE(ventas.unidades, 0) AS total_vendido
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN (
         SELECT producto_id, AVG(calificacion)::numeric(3,2) AS promedio, COUNT(*) AS total
         FROM opiniones GROUP BY producto_id
       ) op ON op.producto_id = p.id
       LEFT JOIN (
         SELECT dp.producto_id, SUM(dp.cantidad) AS unidades
         FROM detalles_pedido dp
         JOIN pedidos pe ON pe.id = dp.pedido_id AND pe.estado != 'cancelado'
         GROUP BY dp.producto_id
       ) ventas ON ventas.producto_id = p.id
       WHERE p.productor_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.stock ASC`,
      [productor_id]
    );
  }
}

module.exports = new InventarioRepository();
module.exports.TIPOS_VALIDOS = TIPOS_VALIDOS;
