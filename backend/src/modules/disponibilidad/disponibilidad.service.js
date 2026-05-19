// src/modules/disponibilidad/disponibilidad.service.js
const repo = require('./disponibilidad.repository');
const { AppError } = require('../../utils/errors');

const DIAS_SEMANA = repo.DIAS_SEMANA;

// nombre del día en español sin tilde, lowercase, idéntico al schema
const NOMBRE_DIA_BY_INDEX = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

const normalizarDia = (d) => {
  const v = String(d || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  return DIAS_SEMANA.includes(v) ? v : null;
};

const parseFecha = (s) => {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

class DisponibilidadService {

  // ── Configuración de días de la semana ────────────────────────
  async listarDiasProductor(productorId) {
    return repo.findDiasProductor(productorId);
  }

  async configurarDia({ productor_id, dia, hora_inicio, hora_fin, venta_directa, venta_cocinado }) {
    const diaOk = normalizarDia(dia);
    if (!diaOk) throw new AppError(`Día inválido: ${dia}`, 400);
    if (hora_inicio && hora_fin && hora_inicio >= hora_fin) {
      throw new AppError('hora_fin debe ser mayor a hora_inicio', 400);
    }
    return repo.upsertDia({
      productor_id, dia: diaOk,
      hora_inicio, hora_fin,
      venta_directa, venta_cocinado,
    });
  }

  async desactivarDia(productorId, dia) {
    const diaOk = normalizarDia(dia);
    if (!diaOk) throw new AppError(`Día inválido: ${dia}`, 400);
    await repo.deleteDia(productorId, diaOk);
  }

  // ── Excepciones por fecha ─────────────────────────────────────
  async configurarExcepcion({ productor_id, fecha, tipo, capacidad_max, motivo }) {
    if (!parseFecha(fecha)) throw new AppError('Fecha inválida (YYYY-MM-DD)', 400);
    if (!['disponible','bloqueado'].includes(tipo)) {
      throw new AppError(`Tipo inválido: ${tipo}`, 400);
    }
    return repo.upsertExcepcion({ productor_id, fecha, tipo, capacidad_max, motivo });
  }

  async borrarExcepcion(productorId, fecha) {
    if (!parseFecha(fecha)) throw new AppError('Fecha inválida (YYYY-MM-DD)', 400);
    await repo.deleteExcepcion(productorId, fecha);
  }

  // Bloquea/habilita o limpia un rango [desde, hasta] de una sola vez.
  async configurarExcepcionesBulk({ productor_id, desde, hasta, tipo, capacidad_max, motivo }) {
    const dDesde = parseFecha(desde);
    const dHasta = parseFecha(hasta);
    if (!dDesde || !dHasta) throw new AppError('desde/hasta inválidos (YYYY-MM-DD)', 400);
    if (dHasta < dDesde)    throw new AppError('hasta debe ser >= desde', 400);

    const diff = Math.ceil((dHasta - dDesde) / (1000 * 60 * 60 * 24)) + 1;
    if (diff > 92) throw new AppError('Rango máximo: 92 días', 400);

    const fechas = [];
    for (let i = 0; i < diff; i++) {
      const d = new Date(dDesde);
      d.setDate(d.getDate() + i);
      fechas.push(formatYMD(d));
    }

    if (tipo === 'limpiar') {
      await repo.bulkDeleteExcepciones(productor_id, fechas);
      return { eliminadas: fechas.length, fechas };
    }

    if (!['disponible', 'bloqueado'].includes(tipo)) {
      throw new AppError(`Tipo inválido: ${tipo}`, 400);
    }

    const rows = await repo.bulkUpsertExcepciones({
      productor_id, fechas, tipo, capacidad_max, motivo,
    });
    return { aplicadas: rows.length, excepciones: rows };
  }

  // ── Calendario público: días disponibles entre [desde, hasta] ─
  // Regla (bloqueado por defecto):
  //  - Día está disponible si hay row en productor_disponibilidad tipo=disponible
  //    para esa fecha, o si la fecha es un día_semana presente en dias_venta
  //    Y NO existe row en productor_disponibilidad tipo=bloqueado para esa fecha.
  //  - Si capacidad_max está definida en la excepción, valida cupo restante.
  async calendarioPublico(productorId, desdeStr, hastaStr) {
    const desde = parseFecha(desdeStr);
    const hasta = parseFecha(hastaStr);
    if (!desde || !hasta) throw new AppError('desde/hasta inválidos (YYYY-MM-DD)', 400);
    if (hasta < desde)    throw new AppError('hasta debe ser >= desde', 400);

    const diffDias = Math.ceil((hasta - desde) / (1000*60*60*24)) + 1;
    if (diffDias > 90) throw new AppError('Rango máximo: 90 días', 400);

    const [diasSemana, excepciones] = await Promise.all([
      repo.findDiasProductor(productorId),
      repo.findExcepciones(productorId, desdeStr, hastaStr),
    ]);

    const diasHabilitadosSet = new Set(diasSemana.map(d => normalizarDia(d.dia)).filter(Boolean));
    const excepByFecha = new Map(
      excepciones.map(e => [formatYMD(new Date(e.fecha)), e])
    );

    const dias = [];
    for (let i = 0; i < diffDias; i++) {
      const d = new Date(desde);
      d.setDate(d.getDate() + i);
      const ymd = formatYMD(d);
      const nombre = NOMBRE_DIA_BY_INDEX[d.getDay()];
      const exc = excepByFecha.get(ymd);

      let disponible;
      let motivo = null;
      let capacidad_max = null;

      if (exc?.tipo === 'bloqueado') {
        disponible = false;
        motivo = exc.motivo || 'No disponible';
      } else if (exc?.tipo === 'disponible') {
        disponible = true;
        capacidad_max = exc.capacidad_max;
      } else if (diasHabilitadosSet.has(nombre)) {
        disponible = true;
      } else {
        disponible = false;
      }

      let cupo_restante = null;
      if (disponible && capacidad_max != null) {
        const usadas = await repo.contarReservasPorFecha(productorId, ymd);
        cupo_restante = Math.max(0, capacidad_max - usadas);
        if (cupo_restante === 0) {
          disponible = false;
          motivo = 'Cupo del día agotado';
        }
      }

      dias.push({
        fecha: ymd,
        dia_semana: nombre,
        disponible,
        capacidad_max,
        cupo_restante,
        motivo,
        es_excepcion: !!exc,
      });
    }

    return dias;
  }

  // Helper interno usado por reservas.service para validar antes de crear.
  async puedeReservarFecha(productorId, fechaStr) {
    const cal = await this.calendarioPublico(productorId, fechaStr, fechaStr);
    return cal[0]?.disponible === true;
  }
}

module.exports = new DisponibilidadService();
