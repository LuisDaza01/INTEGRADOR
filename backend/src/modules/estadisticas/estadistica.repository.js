// estadistica.repository.js
const db = require("../../config/database");

class EstadisticaRepository {
  async obtenerVentasTotales(productorId) {
    const query = `
      SELECT COALESCE(SUM(p.total), 0) as total
      FROM pedidos p
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1 AND p.estado != 'cancelado'
    `;
    const result = await db.query(query, [productorId]);
    return parseFloat(result[0].total);
  }

  async obtenerProduccionTotal(productorId) {
    const result = await db.query(
      `SELECT COALESCE(SUM(stock), 0) as total FROM productos WHERE productor_id = $1`,
      [productorId]
    );
    return parseInt(result[0].total);
  }

  async obtenerClientesActivos(productorId) {
    const result = await db.query(
      `SELECT COUNT(DISTINCT p.consumidor_id) as total
       FROM pedidos p
       JOIN detalles_pedido dp ON p.id = dp.pedido_id
       JOIN productos pr ON dp.producto_id = pr.id
       WHERE pr.productor_id = $1`,
      [productorId]
    );
    return parseInt(result[0].total);
  }

  async obtenerVentasMensuales(productorId) {
    return await db.query(
      `SELECT TO_CHAR(p.fecha_pedido, 'Mon') as mes,
              COALESCE(SUM(p.total), 0) as valor,
              EXTRACT(MONTH FROM p.fecha_pedido) as mes_numero
       FROM pedidos p
       JOIN detalles_pedido dp ON p.id = dp.pedido_id
       JOIN productos pr ON dp.producto_id = pr.id
       WHERE pr.productor_id = $1
         AND p.fecha_pedido >= NOW() - INTERVAL '12 months'
         AND p.estado != 'cancelado'
       GROUP BY mes, mes_numero
       ORDER BY mes_numero`,
      [productorId]
    );
  }

  async obtenerDistribucionProductos(productorId) {
    return await db.query(
      `SELECT pr.nombre as producto,
              COUNT(dp.id) as cantidad,
              ROUND(COUNT(dp.id) * 100.0 / NULLIF(SUM(COUNT(dp.id)) OVER (), 0), 1) as porcentaje
       FROM detalles_pedido dp
       JOIN productos pr ON dp.producto_id = pr.id
       WHERE pr.productor_id = $1
       GROUP BY pr.id, pr.nombre
       ORDER BY cantidad DESC
       LIMIT 5`,
      [productorId]
    );
  }

  async obtenerPedidosPorEstado(productorId) {
    return await db.query(
      `SELECT p.estado, COUNT(*) as cantidad
       FROM pedidos p
       JOIN detalles_pedido dp ON p.id = dp.pedido_id
       JOIN productos pr ON dp.producto_id = pr.id
       WHERE pr.productor_id = $1
       GROUP BY p.estado`,
      [productorId]
    );
  }

  async obtenerProductosMasVendidos(productorId, limit = 10) {
    return await db.query(
      `SELECT pr.id, pr.nombre, pr.precio,
              COUNT(dp.id) as total_vendido,
              SUM(dp.cantidad) as unidades_vendidas,
              SUM(dp.cantidad * dp.precio_unitario) as ingresos_generados
       FROM detalles_pedido dp
       JOIN productos pr ON dp.producto_id = pr.id
       JOIN pedidos p ON dp.pedido_id = p.id
       WHERE pr.productor_id = $1 AND p.estado != 'cancelado'
       GROUP BY pr.id, pr.nombre, pr.precio
       ORDER BY unidades_vendidas DESC
       LIMIT $2`,
      [productorId, limit]
    );
  }

  async obtenerTasaConversion(productorId) {
    const result = await db.query(
      `SELECT COUNT(CASE WHEN p.estado = 'entregado' THEN 1 END) as completados,
              COUNT(CASE WHEN p.estado = 'cancelado' THEN 1 END) as cancelados,
              COUNT(*) as total
       FROM pedidos p
       JOIN detalles_pedido dp ON p.id = dp.pedido_id
       JOIN productos pr ON dp.producto_id = pr.id
       WHERE pr.productor_id = $1`,
      [productorId]
    );
    return result[0];
  }

  async obtenerVentasPorProductor() {
    return await db.query(
      `SELECT u.id, u.nombre, u.nombre_empresa,
              COALESCE(SUM(dp.cantidad * dp.precio_unitario), 0) as total_ventas,
              COUNT(DISTINCT p.id) as total_pedidos,
              COUNT(DISTINCT pr.id) as total_productos,
              COUNT(DISTINCT p.consumidor_id) as total_clientes
       FROM usuarios u
       LEFT JOIN productos pr ON pr.productor_id = u.id
       LEFT JOIN detalles_pedido dp ON dp.producto_id = pr.id
       LEFT JOIN pedidos p ON dp.pedido_id = p.id AND p.estado != 'cancelado'
       WHERE u.rol_id = 2
       GROUP BY u.id, u.nombre, u.nombre_empresa
       ORDER BY total_ventas DESC`
    );
  }

  async obtenerResumenGlobal() {
    const result = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM productos) as total_productos,
        (SELECT COUNT(*) FROM pedidos) as total_pedidos,
        (SELECT COUNT(*) FROM pedidos WHERE estado = 'pendiente') as pedidos_pendientes,
        (SELECT COUNT(*) FROM pedidos WHERE estado = 'entregado') as pedidos_entregados,
        (SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estado != 'cancelado') as ingreso_total`
    );
    return result[0];
  }

  // ───────────────────────────────────────────────────────────
  // MARKETING ANALYTICS
  // ───────────────────────────────────────────────────────────

  // Métricas comparando un período actual contra el período anterior equivalente
  async obtenerMetricasPeriodo(productorId, desde, hasta) {
    const q = `
      SELECT
        COALESCE(SUM(CASE WHEN p.estado != 'cancelado' THEN p.total END), 0)              AS ingresos,
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado != 'cancelado')                       AS pedidos_completados,
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado = 'cancelado')                        AS pedidos_cancelados,
        COUNT(DISTINCT p.id)                                                              AS pedidos_total,
        COUNT(DISTINCT p.consumidor_id)                                                   AS clientes_unicos,
        AVG(CASE WHEN p.estado != 'cancelado' THEN p.total END)                           AS ticket_promedio
      FROM pedidos p
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1
        AND p.fecha_pedido >= $2
        AND p.fecha_pedido <  $3
    `;
    const result = await db.query(q, [productorId, desde, hasta]);
    return result[0];
  }

  // Ventas agrupadas por día del período
  async obtenerVentasPorDia(productorId, desde, hasta) {
    return await db.query(`
      SELECT TO_CHAR(p.fecha_pedido, 'YYYY-MM-DD') AS fecha,
             COALESCE(SUM(p.total), 0)              AS ventas,
             COUNT(DISTINCT p.id)                   AS pedidos
      FROM pedidos p
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1
        AND p.fecha_pedido >= $2
        AND p.fecha_pedido <  $3
        AND p.estado != 'cancelado'
      GROUP BY fecha
      ORDER BY fecha
    `, [productorId, desde, hasta]);
  }

  // Pedidos por hora del día (0–23)
  async obtenerHoraPico(productorId, desde, hasta) {
    return await db.query(`
      SELECT EXTRACT(HOUR FROM p.fecha_pedido)::int AS hora,
             COUNT(*)                                AS pedidos,
             COALESCE(SUM(p.total), 0)              AS ventas
      FROM pedidos p
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1
        AND p.fecha_pedido >= $2
        AND p.fecha_pedido <  $3
        AND p.estado != 'cancelado'
      GROUP BY hora
      ORDER BY hora
    `, [productorId, desde, hasta]);
  }

  // Pedidos por día de la semana (0=domingo … 6=sábado)
  async obtenerDiaSemanaPico(productorId, desde, hasta) {
    return await db.query(`
      SELECT EXTRACT(DOW FROM p.fecha_pedido)::int AS dow,
             COUNT(*)                               AS pedidos,
             COALESCE(SUM(p.total), 0)             AS ventas
      FROM pedidos p
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1
        AND p.fecha_pedido >= $2
        AND p.fecha_pedido <  $3
        AND p.estado != 'cancelado'
      GROUP BY dow
      ORDER BY dow
    `, [productorId, desde, hasta]);
  }

  // Top clientes que más han gastado en el período
  async obtenerTopClientes(productorId, desde, hasta, limit = 5) {
    return await db.query(`
      SELECT u.id, u.nombre, u.foto_perfil,
             COUNT(DISTINCT p.id)               AS pedidos,
             COALESCE(SUM(p.total), 0)          AS gastado
      FROM pedidos p
      JOIN usuarios u           ON u.id = p.consumidor_id
      JOIN detalles_pedido dp   ON p.id = dp.pedido_id
      JOIN productos pr         ON dp.producto_id = pr.id
      WHERE pr.productor_id = $1
        AND p.fecha_pedido >= $2
        AND p.fecha_pedido <  $3
        AND p.estado != 'cancelado'
      GROUP BY u.id, u.nombre, u.foto_perfil
      ORDER BY gastado DESC
      LIMIT $4
    `, [productorId, desde, hasta, limit]);
  }

  // Funnel de reservas: creadas / aceptadas / rechazadas / expiradas en el período
  async obtenerFunnelReservas(productorId, desde, hasta) {
    return await db.query(`
      SELECT estado, COUNT(*)::int AS cantidad
      FROM reservas
      WHERE productor_id = $1
        AND fecha_creacion >= $2
        AND fecha_creacion <  $3
      GROUP BY estado
    `, [productorId, desde, hasta]);
  }

  async obtenerDatosPrediccion(productorId) {
    return await db.query(
      `SELECT
         DATE_TRUNC('month', p.fecha_pedido)                                        AS mes_fecha,
         TO_CHAR(p.fecha_pedido, 'Mon YYYY')                                        AS mes_label,
         (EXTRACT(YEAR  FROM p.fecha_pedido)::int * 12
          + EXTRACT(MONTH FROM p.fecha_pedido)::int)                                AS periodo,
         COALESCE(SUM(p.total), 0)                                                  AS ventas,
         COUNT(DISTINCT p.id)                                                        AS num_pedidos,
         COALESCE(AVG(dp.precio_unitario), 0)                                        AS precio_promedio
       FROM pedidos p
       JOIN detalles_pedido dp ON dp.pedido_id = p.id
       JOIN productos        pr ON pr.id = dp.producto_id
       WHERE pr.productor_id = $1
         AND p.estado != 'cancelado'
         AND p.fecha_pedido >= NOW() - INTERVAL '24 months'
       GROUP BY mes_fecha, mes_label, periodo
       ORDER BY periodo`,
      [productorId]
    );
  }
}

module.exports = new EstadisticaRepository();