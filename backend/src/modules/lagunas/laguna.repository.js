const db = require('../../config/database');

class LagunaRepository {

  // ── TIPOS DE ALIMENTO ──────────────────────────────────────────
  async findTiposAlimento() {
    return db.query(
      `SELECT id, nombre, codigo, fase, peso_min_pez_g, peso_max_pez_g,
              porcentaje_biomasa, frecuencia_dia
       FROM tipos_alimento
       ORDER BY peso_min_pez_g`
    );
  }

  // ── ESPECIES ───────────────────────────────────────────────────
  async findEspecies(productorId) {
    return db.query(
      `SELECT id, nombre, peso_inicial_g, peso_objetivo_g, duracion_ciclo_dias,
              es_sistema, creado_por
       FROM especies
       WHERE es_sistema = true OR creado_por = $1
       ORDER BY es_sistema DESC, nombre`,
      [productorId]
    );
  }

  async createEspecie(data) {
    const { nombre, peso_inicial_g, peso_objetivo_g, duracion_ciclo_dias, productorId } = data;
    const result = await db.query(
      `INSERT INTO especies (nombre, peso_inicial_g, peso_objetivo_g, duracion_ciclo_dias, creado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, peso_inicial_g, peso_objetivo_g, duracion_ciclo_dias, productorId]
    );
    return result[0];
  }

  // ── LAGUNAS ────────────────────────────────────────────────────
  async findByProductor(productorId) {
    return db.query(
      `SELECT l.*,
         s.id             AS siembra_id,
         s.especie_id,
         e.nombre         AS especie_nombre,
         s.cantidad_inicial,
         s.peces_actuales,
         s.peso_inicial_g,
         s.peso_objetivo_g,
         s.fecha_siembra,
         s.duracion_dias,
         s.fecha_cosecha_estimada,
         s.precio_venta_kg_bs,
         s.precio_alevines_bs,
         s.estado         AS siembra_estado
       FROM lagunas l
       LEFT JOIN siembras s ON s.laguna_id = l.id AND s.estado = 'activa'
       LEFT JOIN especies e ON e.id = s.especie_id
       WHERE l.productor_id = $1 AND l.activa = true
       ORDER BY l.created_at DESC`,
      [productorId]
    );
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT l.*,
         s.id             AS siembra_id,
         s.especie_id,
         e.nombre         AS especie_nombre,
         s.cantidad_inicial,
         s.peces_actuales,
         s.peso_inicial_g,
         s.peso_objetivo_g,
         s.fecha_siembra,
         s.duracion_dias,
         s.fecha_cosecha_estimada,
         s.precio_venta_kg_bs,
         s.precio_alevines_bs,
         s.estado         AS siembra_estado
       FROM lagunas l
       LEFT JOIN siembras s ON s.laguna_id = l.id AND s.estado = 'activa'
       LEFT JOIN especies e ON e.id = s.especie_id
       WHERE l.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { productor_id, nombre, capacidad_maxima, descripcion } = data;
    const codigo = 'NP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await db.query(
      `INSERT INTO lagunas (productor_id, nombre, capacidad_maxima, descripcion, codigo_dispositivo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [productor_id, nombre, capacidad_maxima || null, descripcion || null, codigo]
    );
    return result[0];
  }

  async updateCodigo(id, codigo) {
    const result = await db.query(
      `UPDATE lagunas SET codigo_dispositivo = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [codigo || null, id]
    );
    return result[0] || null;
  }

  async update(id, data) {
    const { nombre, capacidad_maxima, descripcion } = data;
    const result = await db.query(
      `UPDATE lagunas
       SET nombre = $1, capacidad_maxima = $2, descripcion = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [nombre, capacidad_maxima || null, descripcion || null, id]
    );
    return result[0] || null;
  }

  async desactivar(id) {
    const result = await db.query(
      `UPDATE lagunas SET activa = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result[0] || null;
  }

  async verificarPropietario(lagunaId, productorId) {
    const rows = await db.query(
      'SELECT id FROM lagunas WHERE id = $1 AND productor_id = $2 AND activa = true',
      [lagunaId, productorId]
    );
    return rows.length > 0;
  }

  // ── SIEMBRAS ───────────────────────────────────────────────────
  async findSiembraActiva(lagunaId) {
    const rows = await db.query(
      `SELECT s.*, e.nombre AS especie_nombre
       FROM siembras s
       LEFT JOIN especies e ON e.id = s.especie_id
       WHERE s.laguna_id = $1 AND s.estado = 'activa'`,
      [lagunaId]
    );
    return rows[0] || null;
  }

  async findSiembraById(siembraId) {
    const rows = await db.query(
      `SELECT s.*, e.nombre AS especie_nombre
       FROM siembras s
       LEFT JOIN especies e ON e.id = s.especie_id
       WHERE s.id = $1`,
      [siembraId]
    );
    return rows[0] || null;
  }

  async findHistorialSiembras(lagunaId) {
    return db.query(
      `SELECT s.*, e.nombre AS especie_nombre
       FROM siembras s
       LEFT JOIN especies e ON e.id = s.especie_id
       WHERE s.laguna_id = $1
       ORDER BY s.fecha_siembra DESC`,
      [lagunaId]
    );
  }

  async createSiembra(data) {
    const {
      laguna_id, especie_id, cantidad_inicial, peso_inicial_g,
      peso_objetivo_g, fecha_siembra, duracion_dias,
      precio_alevines_bs, precio_venta_kg_bs
    } = data;
    const fecha_cosecha = new Date(fecha_siembra);
    fecha_cosecha.setDate(fecha_cosecha.getDate() + duracion_dias);

    const result = await db.query(
      `INSERT INTO siembras
         (laguna_id, especie_id, cantidad_inicial, peces_actuales, peso_inicial_g,
          peso_objetivo_g, fecha_siembra, duracion_dias, fecha_cosecha_estimada,
          precio_alevines_bs, precio_venta_kg_bs)
       VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        laguna_id, especie_id, cantidad_inicial, peso_inicial_g,
        peso_objetivo_g, fecha_siembra, duracion_dias,
        fecha_cosecha.toISOString().split('T')[0],
        precio_alevines_bs || 0, precio_venta_kg_bs || 35
      ]
    );
    return result[0];
  }

  async updateSiembra(siembraId, data) {
    const { peces_actuales, estado, precio_venta_kg_bs } = data;
    const result = await db.query(
      `UPDATE siembras
       SET peces_actuales    = COALESCE($1, peces_actuales),
           estado            = COALESCE($2, estado),
           precio_venta_kg_bs = COALESCE($3, precio_venta_kg_bs),
           updated_at        = NOW()
       WHERE id = $4 RETURNING *`,
      [peces_actuales, estado, precio_venta_kg_bs, siembraId]
    );
    return result[0] || null;
  }

  // ── MOVIMIENTOS ────────────────────────────────────────────────
  async createMovimiento(data) {
    const {
      siembra_id, laguna_id, tipo, cantidad, unidad,
      descripcion, ingreso_bs, costo_bs, pedido_id, tipo_alimento_id, fecha
    } = data;
    const result = await db.query(
      `INSERT INTO laguna_movimientos
         (siembra_id, laguna_id, tipo, cantidad, unidad, descripcion,
          ingreso_bs, costo_bs, pedido_id, tipo_alimento_id, fecha)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        siembra_id, laguna_id, tipo, cantidad || 0, unidad || 'peces',
        descripcion || null, ingreso_bs || 0, costo_bs || 0,
        pedido_id || null, tipo_alimento_id || null, fecha || new Date()
      ]
    );
    return result[0];
  }

  async findMovimientos(siembraId, limit = 30, offset = 0) {
    return db.query(
      `SELECT m.*, ta.nombre AS tipo_alimento_nombre, ta.codigo AS tipo_alimento_codigo
       FROM laguna_movimientos m
       LEFT JOIN tipos_alimento ta ON ta.id = m.tipo_alimento_id
       WHERE m.siembra_id = $1
       ORDER BY m.fecha DESC
       LIMIT $2 OFFSET $3`,
      [siembraId, limit, offset]
    );
  }

  async sumIngresosBySiembra(siembraId) {
    const rows = await db.query(
      `SELECT COALESCE(SUM(ingreso_bs), 0)::numeric(12,2) AS total_ingresos,
              COALESCE(SUM(costo_bs), 0)::numeric(12,2)   AS total_costos,
              COALESCE(SUM(CASE WHEN tipo = 'alimentacion' THEN costo_bs ELSE 0 END), 0)::numeric(12,2) AS costo_alimento,
              COALESCE(SUM(CASE WHEN tipo = 'venta' THEN cantidad ELSE 0 END), 0)::numeric(12,2) AS kg_vendidos
       FROM laguna_movimientos
       WHERE siembra_id = $1`,
      [siembraId]
    );
    return rows[0];
  }

  // ── STOCK ALIMENTO ─────────────────────────────────────────────
  async findStockAlimento(productorId) {
    return db.query(
      `SELECT sa.*, ta.nombre, ta.codigo, ta.fase,
              ta.peso_min_pez_g, ta.peso_max_pez_g,
              ta.porcentaje_biomasa, ta.frecuencia_dia
       FROM tipos_alimento ta
       LEFT JOIN stock_alimento sa
         ON sa.tipo_alimento_id = ta.id AND sa.productor_id = $1
       ORDER BY ta.peso_min_pez_g`,
      [productorId]
    );
  }

  async upsertStockAlimento(productorId, tipoAlimentoId, sacosDelta, costoPorSaco) {
    const result = await db.query(
      `INSERT INTO stock_alimento (productor_id, tipo_alimento_id, sacos_disponibles, costo_por_saco_bs)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (productor_id, tipo_alimento_id) DO UPDATE
         SET sacos_disponibles = stock_alimento.sacos_disponibles + $3,
             costo_por_saco_bs = COALESCE($4, stock_alimento.costo_por_saco_bs),
             updated_at = NOW()
       RETURNING *`,
      [productorId, tipoAlimentoId, sacosDelta, costoPorSaco || 135]
    );
    return result[0];
  }

  // ── COSTOS ADICIONALES ─────────────────────────────────────────
  async createCosto(data) {
    const { siembra_id, concepto, monto_bs, fecha } = data;
    const result = await db.query(
      `INSERT INTO costos_siembra (siembra_id, concepto, monto_bs, fecha)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [siembra_id, concepto, monto_bs, fecha || new Date()]
    );
    return result[0];
  }

  async sumCostosAdicionalesBySiembra(siembraId) {
    const rows = await db.query(
      `SELECT COALESCE(SUM(monto_bs), 0)::numeric(12,2) AS total
       FROM costos_siembra WHERE siembra_id = $1`,
      [siembraId]
    );
    return parseFloat(rows[0]?.total || 0);
  }
}

module.exports = new LagunaRepository();
