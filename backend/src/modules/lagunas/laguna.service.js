const lagunaRepository = require('./laguna.repository');
const { NotFoundError, ForbiddenError, BusinessError, ValidationError } = require('../../utils/errors');

// Tipos de alimento en orden ascendente de peso
const TIPOS_ALIMENTO = [
  { id: 1, codigo: 'M-0.5', nombre: 'Inicial M-0.5',    fase: 'inicial',     pesoMin: 1,   pesoMax: 5,    porcentajeBiomasa: 10, frecuenciaDia: 3 },
  { id: 2, codigo: 'M-1.5', nombre: 'Inicial M-1.5',    fase: 'inicial',     pesoMin: 5,   pesoMax: 20,   porcentajeBiomasa: 8,  frecuenciaDia: 3 },
  { id: 3, codigo: 'M-2.5', nombre: 'Inicial M-2.5',    fase: 'inicial',     pesoMin: 20,  pesoMax: 80,   porcentajeBiomasa: 6,  frecuenciaDia: 2 },
  { id: 4, codigo: 'M-4',   nombre: 'Inicial M-4',      fase: 'inicial',     pesoMin: 80,  pesoMax: 150,  porcentajeBiomasa: 5,  frecuenciaDia: 2 },
  { id: 5, codigo: 'M-6',   nombre: 'Crecimiento M-6',  fase: 'crecimiento', pesoMin: 150, pesoMax: 350,  porcentajeBiomasa: 4,  frecuenciaDia: 2 },
  { id: 6, codigo: 'M-8',   nombre: 'Crecimiento M-8',  fase: 'crecimiento', pesoMin: 350, pesoMax: 550,  porcentajeBiomasa: 3,  frecuenciaDia: 2 },
  { id: 7, codigo: 'M-10',  nombre: 'Engorde M-10',     fase: 'engorde',     pesoMin: 550, pesoMax: 99999, porcentajeBiomasa: 2, frecuenciaDia: 2 },
];

class LagunaService {

  // ── CÁLCULOS DE PRODUCCIÓN ─────────────────────────────────────

  calcularDiasTranscurridos(fechaSiembra) {
    const inicio = new Date(fechaSiembra);
    const hoy    = new Date();
    return Math.max(0, Math.floor((hoy - inicio) / 86400000));
  }

  calcularPesoActual(siembra) {
    const dias     = this.calcularDiasTranscurridos(siembra.fecha_siembra);
    const progreso = Math.min(dias / siembra.duracion_dias, 1);
    const peso     = siembra.peso_inicial_g + (siembra.peso_objetivo_g - siembra.peso_inicial_g) * progreso;
    return Math.round(peso * 10) / 10;
  }

  calcularTipoAlimentoActual(pesoActualG) {
    return TIPOS_ALIMENTO.find(t => pesoActualG >= t.pesoMin && pesoActualG < t.pesoMax)
      || TIPOS_ALIMENTO[TIPOS_ALIMENTO.length - 1];
  }

  calcularAlimentacionHoy(siembra) {
    const pesoActualG  = this.calcularPesoActual(siembra);
    const tipo         = this.calcularTipoAlimentoActual(pesoActualG);
    const biomasaKg    = (pesoActualG / 1000) * siembra.peces_actuales;
    const totalDiaKg   = (biomasaKg * tipo.porcentajeBiomasa) / 100;
    const porSesionKg  = totalDiaKg / tipo.frecuenciaDia;
    const costoDiaBs   = (totalDiaKg / 25) * 135;

    return {
      tipo,
      pesoActualG,
      biomasaKg:  Math.round(biomasaKg  * 10) / 10,
      totalDiaKg: Math.round(totalDiaKg * 10) / 10,
      porSesionKg:Math.round(porSesionKg* 10) / 10,
      costoDiaBs: Math.round(costoDiaBs * 100) / 100,
    };
  }

  calcularPlanAlimento(siembra) {
    const { duracion_dias, cantidad_inicial, peso_inicial_g, peso_objetivo_g } = siembra;

    const diaParaPeso = (pesoG) => {
      if (pesoG <= peso_inicial_g) return 0;
      if (pesoG >= peso_objetivo_g) return duracion_dias;
      return Math.round(((pesoG - peso_inicial_g) / (peso_objetivo_g - peso_inicial_g)) * duracion_dias);
    };

    return TIPOS_ALIMENTO.map(tipo => {
      const diaInicio = diaParaPeso(tipo.pesoMin);
      const diaFin    = diaParaPeso(tipo.pesoMax);
      const dias      = Math.max(0, Math.min(diaFin, duracion_dias) - Math.max(0, diaInicio));

      if (dias <= 0) return null;

      const pesoMedioKg  = ((tipo.pesoMin + Math.min(tipo.pesoMax, peso_objetivo_g)) / 2) / 1000;
      const biomasaKg    = pesoMedioKg * cantidad_inicial;
      const feedDiaKg    = (biomasaKg * tipo.porcentajeBiomasa) / 100;
      const totalFeedKg  = feedDiaKg * dias;
      const sacos        = Math.ceil(totalFeedKg / 25);
      const costo        = sacos * 135;

      return {
        tipo,
        diaInicio: Math.max(0, diaInicio),
        diaFin:    Math.min(duracion_dias, diaFin),
        dias,
        sacos,
        costo,
        totalFeedKg: Math.round(totalFeedKg),
      };
    }).filter(Boolean);
  }

  calcularFinanciero(siembra, movimientosSums, costosAdicionales) {
    const dias        = this.calcularDiasTranscurridos(siembra.fecha_siembra);
    const diasRestantes = Math.max(0, siembra.duracion_dias - dias);
    const pesoActualG = this.calcularPesoActual(siembra);
    const biomasaKg   = (pesoActualG / 1000) * siembra.peces_actuales;

    const costoAlimento    = parseFloat(movimientosSums.costo_alimento || 0);
    const totalIngresos    = parseFloat(movimientosSums.total_ingresos || 0);
    const kgVendidos       = parseFloat(movimientosSums.kg_vendidos    || 0);

    const plan             = this.calcularPlanAlimento(siembra);
    const costoAlimentoTotal = plan.reduce((s, p) => s + p.costo, 0);
    const costoAlimentoRestante = Math.max(0, costoAlimentoTotal - costoAlimento);

    const invertidoHoy     = parseFloat(siembra.precio_alevines_bs || 0) + costoAlimento + costosAdicionales;
    const proyeccionTotal  = costoAlimentoTotal + parseFloat(siembra.precio_alevines_bs || 0) + costosAdicionales;
    const ingresoProyectado = biomasaKg * parseFloat(siembra.precio_venta_kg_bs || 35);
    const gananciaProyectada = ingresoProyectado - proyeccionTotal;

    return {
      dias,
      diasRestantes,
      progresoPct: Math.min(100, Math.round((dias / siembra.duracion_dias) * 100)),
      pesoActualG,
      biomasaKg:         Math.round(biomasaKg     * 10) / 10,
      kgVendidos:        Math.round(kgVendidos     * 10) / 10,
      invertidoHoy:      Math.round(invertidoHoy),
      costoAlimento,
      costoAlimentoRestante: Math.round(costoAlimentoRestante),
      proyeccionTotal:   Math.round(proyeccionTotal),
      totalIngresos:     Math.round(totalIngresos),
      ingresoProyectado: Math.round(ingresoProyectado),
      gananciaProyectada:Math.round(gananciaProyectada),
    };
  }

  enriquecerLaguna(laguna) {
    if (!laguna.siembra_id) return { ...laguna, produccion: null };

    const siembra = {
      id:                   laguna.siembra_id,
      especie_id:           laguna.especie_id,
      especie_nombre:       laguna.especie_nombre,
      cantidad_inicial:     laguna.cantidad_inicial,
      peces_actuales:       laguna.peces_actuales,
      peso_inicial_g:       laguna.peso_inicial_g,
      peso_objetivo_g:      laguna.peso_objetivo_g,
      fecha_siembra:        laguna.fecha_siembra,
      duracion_dias:        laguna.duracion_dias,
      fecha_cosecha_estimada: laguna.fecha_cosecha_estimada,
      precio_venta_kg_bs:   laguna.precio_venta_kg_bs,
      precio_alevines_bs:   laguna.precio_alevines_bs,
      estado:               laguna.siembra_estado,
    };

    const alimentacion = this.calcularAlimentacionHoy(siembra);
    const dias         = this.calcularDiasTranscurridos(siembra.fecha_siembra);
    const progreso     = Math.min(100, Math.round((dias / siembra.duracion_dias) * 100));
    const diasRestantes = Math.max(0, siembra.duracion_dias - dias);

    return {
      ...laguna,
      produccion: {
        ...siembra,
        dias,
        diasRestantes,
        progresoPct: progreso,
        pesoActualG: alimentacion.pesoActualG,
        biomasaKg:   alimentacion.biomasaKg,
        alimentacion,
      },
    };
  }

  // ── LAGUNAS CRUD ───────────────────────────────────────────────

  async getMisLagunas(productorId) {
    const lagunas = await lagunaRepository.findByProductor(productorId);
    return lagunas.map(l => this.enriquecerLaguna(l));
  }

  async getLagunaDetalle(lagunaId, productorId) {
    const laguna = await lagunaRepository.findById(lagunaId);
    if (!laguna) throw new NotFoundError('Laguna no encontrada');

    const esPropietario = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!esPropietario) throw new ForbiddenError('No tienes acceso a esta laguna');

    const enriquecida = this.enriquecerLaguna(laguna);

    if (laguna.siembra_id) {
      const siembra = {
        id: laguna.siembra_id,
        peces_actuales: laguna.peces_actuales,
        cantidad_inicial: laguna.cantidad_inicial,
        peso_inicial_g: laguna.peso_inicial_g,
        peso_objetivo_g: laguna.peso_objetivo_g,
        fecha_siembra: laguna.fecha_siembra,
        duracion_dias: laguna.duracion_dias,
        precio_venta_kg_bs: laguna.precio_venta_kg_bs,
        precio_alevines_bs: laguna.precio_alevines_bs,
      };

      const [sums, costosAdicionales, movimientos, planAlimento] = await Promise.all([
        lagunaRepository.sumIngresosBySiembra(laguna.siembra_id),
        lagunaRepository.sumCostosAdicionalesBySiembra(laguna.siembra_id),
        lagunaRepository.findMovimientos(laguna.siembra_id, 20, 0),
        Promise.resolve(this.calcularPlanAlimento(siembra)),
      ]);

      enriquecida.financiero   = this.calcularFinanciero(siembra, sums, costosAdicionales);
      enriquecida.movimientos  = movimientos;
      enriquecida.planAlimento = planAlimento;
    }

    return enriquecida;
  }

  async crearLaguna(data, productorId) {
    if (!data.nombre?.trim()) {
      const err = new ValidationError('Nombre requerido');
      err.addError('nombre', 'El nombre de la laguna es obligatorio');
      throw err;
    }
    return lagunaRepository.create({ ...data, productor_id: productorId });
  }

  async actualizarLaguna(lagunaId, data, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    if (!data.nombre?.trim()) {
      const err = new ValidationError('Nombre requerido');
      err.addError('nombre', 'El nombre de la laguna es obligatorio');
      throw err;
    }
    const updated = await lagunaRepository.update(lagunaId, data);
    if (!updated) throw new NotFoundError('Laguna no encontrada');
    return updated;
  }

  async vincularDispositivo(lagunaId, codigo, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    // Valida que el código exista en la tabla `dispositivos`, esté activo
    // y no esté ya vinculado a otra laguna distinta.
    const dispositivoService = require('../dispositivos/dispositivo.service');
    const disp = await dispositivoService.validarParaVinculacion(codigo, lagunaId);

    const updated = await lagunaRepository.updateCodigo(lagunaId, disp.codigo);
    if (!updated) throw new NotFoundError('Laguna no encontrada');

    // Marca el dispositivo como asignado a esta laguna (idempotente)
    await dispositivoService.marcarAsignado(disp.id, Number(lagunaId));

    return updated;
  }

  async eliminarLaguna(lagunaId, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    const siembra = await lagunaRepository.findSiembraActiva(lagunaId);
    if (siembra) throw new BusinessError('No puedes eliminar una laguna con siembra activa');

    return lagunaRepository.desactivar(lagunaId);
  }

  // ── SIEMBRAS ───────────────────────────────────────────────────

  async iniciarSiembra(lagunaId, data, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    const existente = await lagunaRepository.findSiembraActiva(lagunaId);
    if (existente) throw new BusinessError('Esta laguna ya tiene una siembra activa. Cosecha primero la producción actual.');

    const { cantidad_inicial, peso_inicial_g, peso_objetivo_g, duracion_dias } = data;
    if (!cantidad_inicial || cantidad_inicial < 1)
      throw new BusinessError('La cantidad de alevines debe ser mayor a 0');
    if (!duracion_dias || duracion_dias < 1)
      throw new BusinessError('La duración del ciclo debe ser mayor a 0 días');

    return lagunaRepository.createSiembra({ laguna_id: lagunaId, ...data });
  }

  async cosechar(lagunaId, data, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    const siembra = await lagunaRepository.findSiembraActiva(lagunaId);
    if (!siembra) throw new NotFoundError('No hay siembra activa en esta laguna');

    const { kg_cosechados, descripcion } = data;
    if (!kg_cosechados || kg_cosechados <= 0)
      throw new BusinessError('Debes indicar los kg cosechados');

    await lagunaRepository.createMovimiento({
      siembra_id: siembra.id,
      laguna_id:  lagunaId,
      tipo:       'cosecha',
      cantidad:   kg_cosechados,
      unidad:     'kg',
      descripcion: descripcion || 'Cosecha final',
      ingreso_bs: kg_cosechados * parseFloat(siembra.precio_venta_kg_bs || 35),
    });

    await lagunaRepository.updateSiembra(siembra.id, { estado: 'cosechada' });
    return { message: 'Cosecha registrada exitosamente' };
  }

  // ── MOVIMIENTOS ────────────────────────────────────────────────

  async registrarMovimiento(lagunaId, data, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    const siembra = await lagunaRepository.findSiembraActiva(lagunaId);
    if (!siembra) throw new NotFoundError('No hay siembra activa en esta laguna');

    const { tipo, cantidad, descripcion, tipo_alimento_id } = data;
    const tiposValidos = ['alimentacion', 'mortalidad', 'costo', 'venta'];
    if (!tiposValidos.includes(tipo))
      throw new BusinessError('Tipo de movimiento inválido');

    let costoBs = 0, ingresoBs = 0, unidad = 'peces';

    if (tipo === 'alimentacion') {
      const alimentacion = this.calcularAlimentacionHoy(siembra);
      const kgAlimento   = cantidad || alimentacion.porSesionKg;
      costoBs = (kgAlimento / 25) * 135;
      unidad  = 'kg';
    }

    if (tipo === 'mortalidad') {
      const nuevos = Math.max(0, siembra.peces_actuales - Math.round(cantidad || 0));
      await lagunaRepository.updateSiembra(siembra.id, { peces_actuales: nuevos });
    }

    if (tipo === 'venta') {
      ingresoBs = (cantidad || 0) * parseFloat(siembra.precio_venta_kg_bs || 35);
      const pecesDescontados = Math.round((cantidad || 0) / (this.calcularPesoActual(siembra) / 1000));
      const nuevos = Math.max(0, siembra.peces_actuales - pecesDescontados);
      await lagunaRepository.updateSiembra(siembra.id, { peces_actuales: nuevos });
      unidad = 'kg';
    }

    if (tipo === 'costo') {
      costoBs = cantidad || 0;
      unidad  = 'bs';
    }

    return lagunaRepository.createMovimiento({
      siembra_id:      siembra.id,
      laguna_id:       lagunaId,
      tipo,
      cantidad:        cantidad || 0,
      unidad,
      descripcion:     descripcion || null,
      costo_bs:        costoBs,
      ingreso_bs:      ingresoBs,
      tipo_alimento_id: tipo_alimento_id || null,
    });
  }

  async getMovimientos(lagunaId, productorId, limit = 30, offset = 0) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    const siembra = await lagunaRepository.findSiembraActiva(lagunaId);
    if (!siembra) return [];

    return lagunaRepository.findMovimientos(siembra.id, limit, offset);
  }

  // ── ESPECIES ───────────────────────────────────────────────────

  async getEspecies(productorId) {
    return lagunaRepository.findEspecies(productorId);
  }

  async crearEspecie(data, productorId) {
    if (!data.nombre?.trim()) {
      const err = new ValidationError('Nombre requerido');
      err.addError('nombre', 'El nombre de la especie es obligatorio');
      throw err;
    }
    return lagunaRepository.createEspecie({ ...data, productorId });
  }

  // ── STOCK ALIMENTO ─────────────────────────────────────────────

  async getStockAlimento(productorId) {
    const stock = await lagunaRepository.findStockAlimento(productorId);
    return stock.map(s => ({
      ...s,
      sacos_disponibles: s.sacos_disponibles || 0,
      costo_por_saco_bs: s.costo_por_saco_bs || 135,
      peso_saco_kg:      s.peso_saco_kg || 25,
    }));
  }

  async registrarCompraAlimento(productorId, data) {
    const { tipo_alimento_id, sacos, costo_por_saco } = data;
    if (!tipo_alimento_id || !sacos || sacos < 1)
      throw new BusinessError('Datos de compra inválidos');

    return lagunaRepository.upsertStockAlimento(
      productorId, tipo_alimento_id, sacos, costo_por_saco
    );
  }

  // ── HISTORIAL DE SIEMBRAS ──────────────────────────────────────

  async getHistorial(lagunaId, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');
    return lagunaRepository.findHistorialSiembras(lagunaId);
  }

  // ── TIPOS DE ALIMENTO ──────────────────────────────────────────

  async getTiposAlimento() {
    return TIPOS_ALIMENTO;
  }

  // ── SENSORES (lecturas IoT persistidas) ────────────────────────

  async getSensoresLatest(lagunaId, productorId) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');
    return lagunaRepository.getSensoresLatest(lagunaId);
  }

  async getSensoresHistory(lagunaId, productorId, { desde, hasta, bucket, limit } = {}) {
    const ok = await lagunaRepository.verificarPropietario(lagunaId, productorId);
    if (!ok) throw new ForbiddenError('No tienes acceso a esta laguna');

    // Defaults: últimas 24 h, bucket horario
    const ahora  = new Date();
    const hastaD = hasta ? new Date(hasta) : ahora;
    const desdeD = desde ? new Date(desde) : new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    if (isNaN(desdeD.getTime()) || isNaN(hastaD.getTime())) {
      throw new ValidationError('Parámetros "desde" / "hasta" deben ser fechas ISO válidas');
    }
    if (desdeD >= hastaD) {
      throw new ValidationError('"desde" debe ser anterior a "hasta"');
    }

    const bucketNorm = ['raw', 'hour', 'day'].includes(bucket) ? bucket : 'hour';
    const limitNorm  = Math.max(1, Math.min(parseInt(limit, 10) || 500, 2000));

    const points = await lagunaRepository.getSensoresHistory(lagunaId, {
      desde: desdeD,
      hasta: hastaD,
      bucket: bucketNorm,
      limit: limitNorm,
    });

    return {
      laguna_id: parseInt(lagunaId, 10),
      desde: desdeD.toISOString(),
      hasta: hastaD.toISOString(),
      bucket: bucketNorm,
      total: points.length,
      points,
    };
  }
}

module.exports = new LagunaService();
