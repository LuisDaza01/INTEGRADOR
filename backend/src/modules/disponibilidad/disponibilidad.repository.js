// src/modules/disponibilidad/disponibilidad.repository.js
const db = require('../../config/database');

const DIAS_SEMANA = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];

class DisponibilidadRepository {
  // ── DÍAS DE LA SEMANA (tabla dias_venta) ──────────────────────
  async findDiasProductor(productorId) {
    return db.query(
      `SELECT id, dia, hora_inicio, hora_fin, venta_directa, venta_cocinado
       FROM dias_venta
       WHERE productor_id = $1`,
      [productorId]
    );
  }

  async upsertDia({ productor_id, dia, hora_inicio, hora_fin, venta_directa, venta_cocinado }) {
    const rows = await db.query(
      `INSERT INTO dias_venta (productor_id, dia, hora_inicio, hora_fin, venta_directa, venta_cocinado)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (productor_id, dia) DO UPDATE SET
         hora_inicio    = EXCLUDED.hora_inicio,
         hora_fin       = EXCLUDED.hora_fin,
         venta_directa  = EXCLUDED.venta_directa,
         venta_cocinado = EXCLUDED.venta_cocinado
       RETURNING id, dia, hora_inicio, hora_fin, venta_directa, venta_cocinado`,
      [productor_id, dia, hora_inicio || null, hora_fin || null,
       venta_directa !== false, !!venta_cocinado]
    );
    return rows[0];
  }

  async deleteDia(productorId, dia) {
    await db.query(
      `DELETE FROM dias_venta WHERE productor_id = $1 AND dia = $2`,
      [productorId, dia]
    );
  }

  // ── EXCEPCIONES POR FECHA ─────────────────────────────────────
  async findExcepciones(productorId, desde, hasta) {
    return db.query(
      `SELECT id, fecha, tipo, capacidad_max, motivo
       FROM productor_disponibilidad
       WHERE productor_id = $1
         AND fecha >= $2 AND fecha <= $3
       ORDER BY fecha ASC`,
      [productorId, desde, hasta]
    );
  }

  async upsertExcepcion({ productor_id, fecha, tipo, capacidad_max, motivo }) {
    const rows = await db.query(
      `INSERT INTO productor_disponibilidad (productor_id, fecha, tipo, capacidad_max, motivo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (productor_id, fecha) DO UPDATE SET
         tipo          = EXCLUDED.tipo,
         capacidad_max = EXCLUDED.capacidad_max,
         motivo        = EXCLUDED.motivo
       RETURNING id, fecha, tipo, capacidad_max, motivo`,
      [productor_id, fecha, tipo, capacidad_max || null, motivo || null]
    );
    return rows[0];
  }

  async deleteExcepcion(productorId, fecha) {
    await db.query(
      `DELETE FROM productor_disponibilidad WHERE productor_id = $1 AND fecha = $2`,
      [productorId, fecha]
    );
  }

  // Aplica el mismo tipo/motivo/capacidad a un rango de fechas en una sola transacción.
  async bulkUpsertExcepciones({ productor_id, fechas, tipo, capacidad_max, motivo }) {
    return db.transaction(async (tx) => {
      const result = [];
      for (const fecha of fechas) {
        const rows = await tx.query(
          `INSERT INTO productor_disponibilidad (productor_id, fecha, tipo, capacidad_max, motivo)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (productor_id, fecha) DO UPDATE SET
             tipo          = EXCLUDED.tipo,
             capacidad_max = EXCLUDED.capacidad_max,
             motivo        = EXCLUDED.motivo
           RETURNING id, fecha, tipo, capacidad_max, motivo`,
          [productor_id, fecha, tipo, capacidad_max || null, motivo || null]
        );
        result.push(rows[0]);
      }
      return result;
    });
  }

  async bulkDeleteExcepciones(productorId, fechas) {
    if (!fechas?.length) return;
    await db.query(
      `DELETE FROM productor_disponibilidad WHERE productor_id = $1 AND fecha = ANY($2::date[])`,
      [productorId, fechas]
    );
  }

  // ── CONTEO DE RESERVAS POR DÍA (para capacidad_max) ───────────
  async contarReservasPorFecha(productorId, fecha) {
    const rows = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM reservas
       WHERE productor_id = $1
         AND fecha_reserva = $2
         AND estado IN ('pendiente', 'aceptada')`,
      [productorId, fecha]
    );
    return rows[0]?.total || 0;
  }
}

module.exports = new DisponibilidadRepository();
module.exports.DIAS_SEMANA = DIAS_SEMANA;
