// ============================================================
// src/modules/productos/trazabilidad.controller.js
// ============================================================
const db = require('../../config/database');

const getTrazabilidad = async (req, res) => {
  try {
    const { id } = req.params;

    // ── 1. Datos del producto + productor ─────────────────
    const productoResult = await db.query(`
      SELECT
        p.id              AS producto_id,
        p.nombre          AS producto_nombre,
        p.descripcion     AS producto_descripcion,
        p.precio,
        p.imagen,
        p.created_at      AS fecha_creacion,
        -- Productor
        u.id              AS productor_id,
        u.nombre          AS productor_nombre,
        u.nombre_empresa,
        u.descripcion     AS productor_descripcion,
        u.ubicacion,
        u.lat             AS productor_lat,
        u.lng             AS productor_lng,
        u.especialidad,
        u.certificaciones,
        u.years_experience,
        u.telefono        AS productor_telefono,
        u.email           AS productor_email,
        -- Categoría
        c.nombre          AS categoria
      FROM productos p
      JOIN usuarios u ON u.id = p.productor_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `, [id]);

    if (productoResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const prod = productoResult[0];

    // ── 2. Último pedido entregado para conocer al repartidor ─
    const entregaResult = await db.query(`
      SELECT
        pe.id             AS pedido_id,
        pe.fecha_entrega_real AS fecha_entrega,
        pe.estado,
        ur.nombre         AS repartidor_nombre
      FROM pedidos pe
      JOIN detalles_pedido dp ON dp.pedido_id = pe.id
      LEFT JOIN usuarios ur ON ur.id = pe.repartidor_id
      WHERE dp.producto_id = $1
        AND pe.estado = 'entregado'
      ORDER BY pe.fecha_entrega_real DESC
      LIMIT 1
    `, [id]);

    const entrega = entregaResult[0] || null;

    // ── 3. Estadísticas de ventas del producto ─────────────
    const statsResult = await db.query(`
      SELECT
        COUNT(DISTINCT pe.id) AS total_pedidos,
        SUM(dp.cantidad)      AS unidades_vendidas
      FROM detalles_pedido dp
      JOIN pedidos pe ON pe.id = dp.pedido_id
      WHERE dp.producto_id = $1 AND pe.estado = 'entregado'
    `, [id]);

    const stats = statsResult[0] || { total_pedidos: 0, unidades_vendidas: 0 };

    // ── 4. Construir respuesta ─────────────────────────────
    const trazabilidad = {
      producto: {
        id:          prod.producto_id,
        nombre:      prod.producto_nombre,
        descripcion: prod.producto_descripcion,
        precio:      prod.precio,
        imagen:      prod.imagen,
        categoria:   prod.categoria,
        fechaRegistro: prod.fecha_creacion,
      },
      productor: {
        id:            prod.productor_id,
        nombre:        prod.productor_nombre,
        empresa:       prod.nombre_empresa,
        descripcion:   prod.productor_descripcion,
        ubicacion:     prod.ubicacion,
        lat:           prod.productor_lat,
        lng:           prod.productor_lng,
        especialidad:  prod.especialidad,
        certificaciones: prod.certificaciones,
        experiencia:   prod.years_experience,
        telefono:      prod.productor_telefono,
        email:         prod.productor_email,
      },
      crianza: {
        especie:         'Tambaqui (Colossoma macropomum)',
        origen:          prod.ubicacion || 'Chapare, Cochabamba, Bolivia',
        parametrosOptimos: {
          temperatura: '25–34 °C (óptimo 27–32 °C)',
          ph:          '6.5–8.5 (óptimo 7.0–7.8)',
          turbidez:    '0–50 NTU (óptimo 5–30 NTU)',
        },
        monitoreo: 'Tiempo real vía ESP32 + Firebase — 24/7',
        alimentacion: 'Alimento balanceado + producto natural de la zona',
      },
      entrega: entrega ? {
        pedidoId:        entrega.pedido_id,
        fechaEntrega:    entrega.fecha_entrega,
        repartidor:      entrega.repartidor_nombre || 'NaturaPiscis Delivery',
      } : null,
      estadisticas: {
        totalPedidos:     parseInt(stats.total_pedidos),
        unidadesVendidas: parseInt(stats.unidades_vendidas) || 0,
      },
      generadoEn: new Date().toISOString(),
      version: '1.0',
    };

    res.json({ success: true, data: trazabilidad });

  } catch (error) {
    console.error('Error en trazabilidad:', error);
    res.status(500).json({ success: false, message: 'Error al obtener trazabilidad' });
  }
};

module.exports = { getTrazabilidad };