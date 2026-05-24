// estadistica.service.js - Lógica de negocio para Estadísticas
const ExcelJS = require('exceljs');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../../config/database');
const estadisticaRepository = require('./estadistica.repository');
const { AppError } = require('../../utils/errors');
const logger = require('../../utils/logger');

// Cliente Claude para resumen mensual (con prompt caching)
const aiClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM_RESUMEN_MENSUAL = `Eres un analista de negocio que escribe resúmenes mensuales amigables para acuicultores bolivianos en la app NaturaPiscis.
Tu tarea: redactar UN párrafo conciso (2-4 oraciones, máximo 400 caracteres) que sintetice el desempeño del mes con tono motivador, profesional y honesto.
Menciona cifras concretas (ventas en Bs, comparación con el mes anterior, producto top). Si hubo caída, sé honesto pero constructivo.
Habla directamente al productor (segunda persona). Sin saludos ni despedidas ni emojis. Responde SOLO con el párrafo.`;

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function simpleOLS(x, y) {
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const ssxx = x.reduce((s, xi) => s + (xi - xMean) ** 2, 0);
  const ssxy = x.reduce((s, xi, i) => s + (xi - xMean) * (y[i] - yMean), 0);
  const b1   = ssxx > 0 ? ssxy / ssxx : 0;
  const b0   = yMean - b1 * xMean;
  const yHat = x.map(xi => b0 + b1 * xi);
  const ssres = y.reduce((s, yi, i) => s + (yi - yHat[i]) ** 2, 0);
  const sstot = y.reduce((s, yi)    => s + (yi - yMean)   ** 2, 0);
  const r2   = sstot > 0 ? 1 - ssres / sstot : 0;
  const rmse = Math.sqrt(ssres / n);
  const se   = n > 2 ? Math.sqrt(ssres / (n - 2)) : rmse;
  return { b0, b1, r2, rmse, se, xMean, ssxx, n };
}

function periodoLabel(p) {
  const month = p % 12 || 12;
  const year  = (p - month) / 12;
  return `${MESES_CORTO[month - 1]} ${year}`;
}

class EstadisticaService {
  async obtenerEstadisticasProductor(productorId) {
    try {
      const [ventasTotales, produccionTotal, clientesActivos, ventasMensuales, distribucionProductos] = await Promise.all([
        estadisticaRepository.obtenerVentasTotales(productorId),
        estadisticaRepository.obtenerProduccionTotal(productorId),
        estadisticaRepository.obtenerClientesActivos(productorId),
        estadisticaRepository.obtenerVentasMensuales(productorId),
        estadisticaRepository.obtenerDistribucionProductos(productorId)
      ]);
      return {
        ventasTotales,
        produccionTotal,
        clientesActivos,
        ventasMensuales: this.formatearVentasMensuales(ventasMensuales),
        distribucionProductos: distribucionProductos.map(d => ({
          producto: d.producto,
          porcentaje: parseFloat(d.porcentaje)
        }))
      };
    } catch (error) {
      throw new AppError('Error al obtener estadísticas del productor', 500);
    }
  }

  async obtenerEstadisticasVentas(productorId) {
    try {
      const [ventasTotales, ventasMensuales, pedidosPorEstado, tasaConversion] = await Promise.all([
        estadisticaRepository.obtenerVentasTotales(productorId),
        estadisticaRepository.obtenerVentasMensuales(productorId),
        estadisticaRepository.obtenerPedidosPorEstado(productorId),
        estadisticaRepository.obtenerTasaConversion(productorId)
      ]);
      const tasaConversionPorcentaje = tasaConversion.total > 0
        ? ((tasaConversion.completados / tasaConversion.total) * 100).toFixed(2) : 0;
      return {
        ventasTotales,
        ventasMensuales: this.formatearVentasMensuales(ventasMensuales),
        pedidosPorEstado,
        tasaConversion: {
          completados: parseInt(tasaConversion.completados),
          cancelados: parseInt(tasaConversion.cancelados),
          total: parseInt(tasaConversion.total),
          porcentaje: parseFloat(tasaConversionPorcentaje)
        }
      };
    } catch (error) {
      throw new AppError('Error al obtener estadísticas de ventas', 500);
    }
  }

  async obtenerEstadisticasProductos(productorId) {
    try {
      const [distribucionProductos, productosMasVendidos, produccionTotal] = await Promise.all([
        estadisticaRepository.obtenerDistribucionProductos(productorId),
        estadisticaRepository.obtenerProductosMasVendidos(productorId, 10),
        estadisticaRepository.obtenerProduccionTotal(productorId)
      ]);
      return {
        produccionTotal,
        distribucionProductos: distribucionProductos.map(d => ({
          producto: d.producto,
          porcentaje: parseFloat(d.porcentaje)
        })),
        productosMasVendidos: productosMasVendidos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          precio: parseFloat(p.precio),
          total_vendido: parseInt(p.total_vendido),
          unidades_vendidas: parseInt(p.unidades_vendidas),
          ingresos_generados: parseFloat(p.ingresos_generados)
        }))
      };
    } catch (error) {
      throw new AppError('Error al obtener estadísticas de productos', 500);
    }
  }

  // NUEVO: para admin
  async obtenerVentasPorProductor() {
    try {
      const data = await estadisticaRepository.obtenerVentasPorProductor();
      return data.map(p => ({
        id: p.id,
        nombre: p.nombre,
        nombre_empresa: p.nombre_empresa,
        total_ventas: parseFloat(p.total_ventas),
        total_pedidos: parseInt(p.total_pedidos),
        total_productos: parseInt(p.total_productos),
        total_clientes: parseInt(p.total_clientes),
      }));
    } catch (error) {
      throw new AppError('Error al obtener ventas por productor', 500);
    }
  }

  async obtenerResumenGlobal() {
    try {
      const data = await estadisticaRepository.obtenerResumenGlobal();
      return {
        totalProductos:    parseInt(data.total_productos),
        totalPedidos:      parseInt(data.total_pedidos),
        pedidosPendientes: parseInt(data.pedidos_pendientes),
        pedidosEntregados: parseInt(data.pedidos_entregados),
        ingresoTotal:      parseFloat(data.ingreso_total),
      };
    } catch (error) {
      throw new AppError('Error al obtener resumen global', 500);
    }
  }


  // ───────────────────────────────────────────────────────────
  // MARKETING ANALYTICS
  // ───────────────────────────────────────────────────────────
  async obtenerMarketingAnalytics(productorId, periodo = '30d') {
    try {
      // Calcular rangos según el período
      const ahora = new Date();
      const hasta = new Date(ahora);
      hasta.setHours(23, 59, 59, 999);
      const desde = new Date(ahora);
      let dias;
      switch (periodo) {
        case 'hoy':  dias = 1;   break;
        case '7d':   dias = 7;   break;
        case '30d':  dias = 30;  break;
        case '90d':  dias = 90;  break;
        case 'año':  dias = 365; break;
        default:     dias = 30;
      }
      desde.setDate(desde.getDate() - dias + 1);
      desde.setHours(0, 0, 0, 0);

      const desdeAnt = new Date(desde);
      desdeAnt.setDate(desdeAnt.getDate() - dias);
      const hastaAnt = new Date(desde);

      const [
        actual, anterior,
        ventasPorDia, horaPico, diaSemanaPico,
        topClientes, topProductos, funnelReservas
      ] = await Promise.all([
        estadisticaRepository.obtenerMetricasPeriodo(productorId, desde.toISOString(), hasta.toISOString()),
        estadisticaRepository.obtenerMetricasPeriodo(productorId, desdeAnt.toISOString(), hastaAnt.toISOString()),
        estadisticaRepository.obtenerVentasPorDia(productorId, desde.toISOString(), hasta.toISOString()),
        estadisticaRepository.obtenerHoraPico(productorId, desde.toISOString(), hasta.toISOString()),
        estadisticaRepository.obtenerDiaSemanaPico(productorId, desde.toISOString(), hasta.toISOString()),
        estadisticaRepository.obtenerTopClientes(productorId, desde.toISOString(), hasta.toISOString(), 5),
        estadisticaRepository.obtenerProductosMasVendidos(productorId, 5),
        estadisticaRepository.obtenerFunnelReservas(productorId, desde.toISOString(), hasta.toISOString()),
      ]);

      // Cálculos derivados
      const pct = (cur, prev) => {
        const c = parseFloat(cur || 0);
        const p = parseFloat(prev || 0);
        if (p === 0) return c === 0 ? 0 : 100;
        return parseFloat((((c - p) / p) * 100).toFixed(1));
      };

      const ingresos = parseFloat(actual.ingresos || 0);
      const ingresosAnt = parseFloat(anterior.ingresos || 0);
      const pedidosCompletados = parseInt(actual.pedidos_completados || 0);
      const pedidosCancelados = parseInt(actual.pedidos_cancelados || 0);
      const pedidosTotal = parseInt(actual.pedidos_total || 0);
      const ticketProm = parseFloat(actual.ticket_promedio || 0);
      const clientes = parseInt(actual.clientes_unicos || 0);

      const tasaCancelacion = pedidosTotal > 0
        ? parseFloat(((pedidosCancelados / pedidosTotal) * 100).toFixed(1))
        : 0;
      const tasaConversion = pedidosTotal > 0
        ? parseFloat(((pedidosCompletados / pedidosTotal) * 100).toFixed(1))
        : 0;

      // Hora pico (la hora con más pedidos)
      const hp = horaPico.reduce((max, h) => parseInt(h.pedidos) > parseInt(max?.pedidos || 0) ? h : max, null);
      const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const dsp = diaSemanaPico.reduce((max, d) => parseFloat(d.ventas) > parseFloat(max?.ventas || 0) ? d : max, null);

      // Funnel reservas
      const funnel = { creadas: 0, aceptadas: 0, rechazadas: 0, expiradas: 0, canceladas: 0, pendientes: 0 };
      funnelReservas.forEach(r => {
        funnel.creadas += r.cantidad;
        if (funnel[r.estado] !== undefined) funnel[r.estado] = r.cantidad;
      });
      const tasaAceptacionReservas = funnel.creadas > 0
        ? parseFloat(((funnel.aceptadas / funnel.creadas) * 100).toFixed(1))
        : 0;

      // Generar insights automáticos (recomendaciones de marketing)
      const insights = [];
      if (dsp) {
        insights.push({
          tipo: 'positivo',
          icono: 'calendar',
          texto: `Tu mejor día de venta es ${diasSemana[parseInt(dsp.dow)]} con Bs ${parseFloat(dsp.ventas).toFixed(2)}`,
        });
      }
      if (hp) {
        const h = parseInt(hp.hora);
        const rango = `${h.toString().padStart(2,'0')}:00 – ${((h+1)%24).toString().padStart(2,'0')}:00`;
        insights.push({
          tipo: 'info',
          icono: 'clock',
          texto: `Hora pico de pedidos: ${rango} (${hp.pedidos} pedidos)`,
        });
      }
      if (tasaCancelacion > 15) {
        insights.push({
          tipo: 'alerta',
          icono: 'alert',
          texto: `Tu tasa de cancelación es ${tasaCancelacion}%. Revisa precios y tiempos de respuesta.`,
        });
      } else if (pedidosCompletados > 0) {
        insights.push({
          tipo: 'positivo',
          icono: 'check',
          texto: `Tasa de cancelación baja (${tasaCancelacion}%). ¡Excelente servicio!`,
        });
      }
      if (pct(ingresos, ingresosAnt) > 20) {
        insights.push({
          tipo: 'positivo',
          icono: 'trending_up',
          texto: `Tus ingresos crecieron ${pct(ingresos, ingresosAnt)}% vs el período anterior. ¡Sigue así!`,
        });
      } else if (pct(ingresos, ingresosAnt) < -10) {
        insights.push({
          tipo: 'alerta',
          icono: 'trending_down',
          texto: `Ingresos bajaron ${Math.abs(pct(ingresos, ingresosAnt))}%. Considera promociones o nuevos productos.`,
        });
      }
      if (topProductos[0]) {
        insights.push({
          tipo: 'info',
          icono: 'star',
          texto: `"${topProductos[0].nombre}" es tu producto estrella (${topProductos[0].unidades_vendidas} unidades vendidas).`,
        });
      }
      if (funnel.creadas > 0 && tasaAceptacionReservas < 70) {
        insights.push({
          tipo: 'alerta',
          icono: 'alert',
          texto: `Sólo aceptas ${tasaAceptacionReservas}% de las reservas. Activa notificaciones para no perder clientes.`,
        });
      }
      if (topClientes[0] && parseInt(topClientes[0].pedidos) >= 3) {
        insights.push({
          tipo: 'info',
          icono: 'heart',
          texto: `${topClientes[0].nombre} es tu cliente top con ${topClientes[0].pedidos} pedidos. Considera ofrecerle algo especial.`,
        });
      }

      return {
        periodo,
        dias,
        rango: { desde: desde.toISOString(), hasta: hasta.toISOString() },
        metricas: {
          ingresos: {
            actual: ingresos,
            anterior: ingresosAnt,
            cambio_pct: pct(ingresos, ingresosAnt),
          },
          pedidos: {
            completados: pedidosCompletados,
            cancelados: pedidosCancelados,
            total: pedidosTotal,
            cambio_pct: pct(pedidosCompletados, parseInt(anterior.pedidos_completados || 0)),
          },
          ticket_promedio: {
            actual: parseFloat(ticketProm.toFixed(2)),
            cambio_pct: pct(ticketProm, parseFloat(anterior.ticket_promedio || 0)),
          },
          clientes_unicos: {
            actual: clientes,
            cambio_pct: pct(clientes, parseInt(anterior.clientes_unicos || 0)),
          },
          tasa_conversion: tasaConversion,
          tasa_cancelacion: tasaCancelacion,
        },
        ventas_por_dia: ventasPorDia.map(v => ({
          fecha: v.fecha,
          ventas: parseFloat(v.ventas),
          pedidos: parseInt(v.pedidos),
        })),
        hora_pico: hp ? {
          hora: parseInt(hp.hora),
          pedidos: parseInt(hp.pedidos),
          ventas: parseFloat(hp.ventas),
        } : null,
        dia_semana_pico: dsp ? {
          dia: diasSemana[parseInt(dsp.dow)],
          dow: parseInt(dsp.dow),
          pedidos: parseInt(dsp.pedidos),
          ventas: parseFloat(dsp.ventas),
        } : null,
        top_clientes: topClientes.map(c => ({
          id: c.id,
          nombre: c.nombre,
          foto_perfil: c.foto_perfil,
          pedidos: parseInt(c.pedidos),
          gastado: parseFloat(c.gastado),
        })),
        top_productos: topProductos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          unidades_vendidas: parseInt(p.unidades_vendidas),
          ingresos: parseFloat(p.ingresos_generados),
        })),
        funnel_reservas: {
          ...funnel,
          tasa_aceptacion: tasaAceptacionReservas,
        },
        insights,
      };
    } catch (error) {
      console.error('Error marketing analytics:', error);
      throw new AppError('Error al obtener métricas de marketing', 500);
    }
  }

  async obtenerPrediccionVentas(productorId) {
    try {
      const datos = await estadisticaRepository.obtenerDatosPrediccion(productorId);

      if (datos.length < 3) {
        return {
          historico: [], prediccion: [], r2: 0, rmse: 0, modelo: '',
          mensaje: 'Se necesitan al menos 3 meses de datos históricos para generar predicciones',
        };
      }

      // Fill missing months between first and last with 0
      const minP = parseInt(datos[0].periodo);
      const maxP = parseInt(datos[datos.length - 1].periodo);
      const dataMap = new Map(datos.map(d => [parseInt(d.periodo), d]));

      const historico = [];
      for (let p = minP; p <= maxP; p++) {
        const d = dataMap.get(p);
        historico.push({
          mes:    d ? d.mes_label : periodoLabel(p),
          valor:  d ? parseFloat(d.ventas) : 0,
          periodo: p,
        });
      }

      // Normalize t to 1, 2, 3 ...
      const x = historico.map((_, i) => i + 1);
      const y = historico.map(d => d.valor);
      const { b0, b1, r2, rmse, se, xMean, ssxx, n } = simpleOLS(x, y);

      // Predict next 6 months
      const t975 = n >= 30 ? 1.96 : (n >= 10 ? 2.23 : 2.57); // approx t critical 95%
      const prediccion = [];
      for (let i = 1; i <= 6; i++) {
        const t    = n + i;
        const yhat = b0 + b1 * t;
        const margin = t975 * se * Math.sqrt(1 + 1 / n + (t - xMean) ** 2 / ssxx);
        prediccion.push({
          mes:   periodoLabel(maxP + i),
          valor: Math.max(0, parseFloat(yhat.toFixed(2))),
          lower: Math.max(0, parseFloat((yhat - margin).toFixed(2))),
          upper: Math.max(0, parseFloat((yhat + margin).toFixed(2))),
          periodo: maxP + i,
        });
      }

      const signo = b1 >= 0 ? '+' : '';
      return {
        historico,
        prediccion,
        r2:     parseFloat(r2.toFixed(4)),
        rmse:   parseFloat(rmse.toFixed(2)),
        modelo: `Ŷ = ${b0.toFixed(2)} ${signo}${b1.toFixed(2)}·t`,
      };
    } catch (error) {
      throw new AppError('Error al generar predicción de ventas', 500);
    }
  }

  formatearVentasMensuales(ventasMensuales) {
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      .map(mes => ({ mes, valor: 0 }));
    ventasMensuales.forEach(venta => {
      const idx = parseInt(venta.mes_numero) - 1;
      if (idx >= 0 && idx < 12) meses[idx].valor = parseFloat(venta.valor);
    });
    return meses;
  }

  // ── EXPORTACIÓN EXCEL ──────────────────────────────────────────
  // Devuelve un Buffer con un workbook .xlsx multi-hoja para el productor.
  async exportarExcel(productorId) {
    const [generales, ventas, productos] = await Promise.all([
      this.obtenerEstadisticasProductor(productorId),
      this.obtenerEstadisticasVentas(productorId),
      this.obtenerEstadisticasProductos(productorId),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'NaturaPiscis';
    wb.created = new Date();

    // Estilos comunes
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { bottom: { style: 'thin', color: { argb: 'FF22C55E' } } },
    };
    const applyHeader = (row) => row.eachCell(c => { c.font = headerStyle.font; c.fill = headerStyle.fill; c.alignment = headerStyle.alignment; c.border = headerStyle.border; });

    // ── Hoja 1: Resumen ─────────────────────────────────────────
    const s1 = wb.addWorksheet('Resumen');
    s1.columns = [{ width: 32 }, { width: 22 }];
    s1.addRow(['NaturaPiscis · Reporte del productor']).font = { bold: true, size: 16, color: { argb: 'FF16A34A' } };
    s1.addRow([`Generado: ${new Date().toLocaleString('es-BO')}`]).font = { italic: true, color: { argb: 'FF64748B' } };
    s1.addRow([]);

    const kpis = [
      ['Ventas totales (Bs)',     Number(generales.ventasTotales) || 0],
      ['Producción total (kg)',   Number(generales.produccionTotal) || 0],
      ['Clientes activos',        Number(generales.clientesActivos) || 0],
      ['Pedidos completados',     ventas.tasaConversion.completados],
      ['Pedidos cancelados',      ventas.tasaConversion.cancelados],
      ['Total pedidos',           ventas.tasaConversion.total],
      ['Tasa de conversión (%)',  ventas.tasaConversion.porcentaje],
    ];
    const h1 = s1.addRow(['Indicador', 'Valor']);
    applyHeader(h1);
    kpis.forEach(([k, v]) => {
      const r = s1.addRow([k, v]);
      r.getCell(1).font = { bold: true };
      if (typeof v === 'number') r.getCell(2).numFmt = '#,##0.00';
    });

    // ── Hoja 2: Ventas mensuales ────────────────────────────────
    const s2 = wb.addWorksheet('Ventas mensuales');
    s2.columns = [{ header: 'Mes', key: 'mes', width: 12 }, { header: 'Ventas (Bs)', key: 'valor', width: 18 }];
    applyHeader(s2.getRow(1));
    generales.ventasMensuales.forEach(m => {
      const r = s2.addRow({ mes: m.mes, valor: m.valor });
      r.getCell(2).numFmt = '#,##0.00';
    });

    // ── Hoja 3: Productos más vendidos ──────────────────────────
    const s3 = wb.addWorksheet('Productos vendidos');
    s3.columns = [
      { header: 'Producto', key: 'nombre',           width: 32 },
      { header: 'Precio (Bs/kg)', key: 'precio',     width: 14 },
      { header: 'Unidades vendidas', key: 'unidades',width: 18 },
      { header: 'Total pedidos', key: 'pedidos',     width: 14 },
      { header: 'Ingresos (Bs)', key: 'ingresos',    width: 16 },
    ];
    applyHeader(s3.getRow(1));
    productos.productosMasVendidos.forEach(p => {
      const r = s3.addRow({
        nombre:   p.nombre,
        precio:   p.precio,
        unidades: p.unidades_vendidas,
        pedidos:  p.total_vendido,
        ingresos: p.ingresos_generados,
      });
      r.getCell(2).numFmt = '#,##0.00';
      r.getCell(5).numFmt = '#,##0.00';
    });

    // ── Hoja 4: Distribución por producto (%) ───────────────────
    const s4 = wb.addWorksheet('Distribución');
    s4.columns = [{ header: 'Producto', key: 'producto', width: 32 }, { header: 'Porcentaje', key: 'pct', width: 14 }];
    applyHeader(s4.getRow(1));
    generales.distribucionProductos.forEach(d => {
      const r = s4.addRow({ producto: d.producto, pct: d.porcentaje });
      r.getCell(2).numFmt = '0.00"%"';
    });

    // ── Hoja 5: Pedidos por estado ──────────────────────────────
    const s5 = wb.addWorksheet('Pedidos por estado');
    s5.columns = [{ header: 'Estado', key: 'estado', width: 24 }, { header: 'Cantidad', key: 'cantidad', width: 12 }];
    applyHeader(s5.getRow(1));
    (ventas.pedidosPorEstado || []).forEach(p => {
      s5.addRow({ estado: p.estado, cantidad: parseInt(p.cantidad || 0) });
    });

    return wb.xlsx.writeBuffer();
  }

  // ── RESUMEN MENSUAL IA ─────────────────────────────────────────
  // Genera (con Claude) un párrafo narrativo del mes, lo guarda en usuarios.
  async generarResumenMensual(productorId) {
    const [generales, productos] = await Promise.all([
      this.obtenerEstadisticasProductor(productorId),
      this.obtenerEstadisticasProductos(productorId),
    ]);
    const now = new Date();
    const idxAct = now.getMonth();
    const idxAnt = (idxAct + 11) % 12;
    const mesActual   = generales.ventasMensuales[idxAct] || { mes: '', valor: 0 };
    const mesAnterior = generales.ventasMensuales[idxAnt] || { mes: '', valor: 0 };
    const ventasAct = Number(mesActual.valor) || 0;
    const ventasAnt = Number(mesAnterior.valor) || 0;
    const variacion = ventasAnt > 0 ? Math.round(((ventasAct - ventasAnt) / ventasAnt) * 100) : null;
    const top = productos.productosMasVendidos[0];

    const datosUsuario = [
      `Mes actual (${mesActual.mes}): ventas Bs ${ventasAct.toFixed(2)}.`,
      `Mes anterior (${mesAnterior.mes}): ventas Bs ${ventasAnt.toFixed(2)}.`,
      variacion !== null ? `Variación: ${variacion > 0 ? '+' : ''}${variacion}%.` : 'Sin mes anterior comparable.',
      top ? `Producto top: ${top.nombre} (${top.unidades_vendidas} unidades, Bs ${Number(top.ingresos_generados).toFixed(2)}).` : 'Sin productos vendidos aún.',
      `Clientes activos: ${generales.clientesActivos}. Producción total acumulada: ${generales.produccionTotal} kg.`,
    ].join('\n');

    const response = await aiClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: [{ type: 'text', text: SYSTEM_RESUMEN_MENSUAL, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: datosUsuario }],
    });
    const texto = (response.content?.[0]?.text || '').trim();
    if (!texto) throw new AppError('No se pudo generar el resumen', 502);

    await db.query(`UPDATE usuarios SET resumen_mensual_ia = $1, resumen_mensual_at = NOW() WHERE id = $2`, [texto, productorId]);
    return { texto, generado_at: new Date() };
  }

  // Devuelve el resumen cacheado en BD (null si no se ha generado nunca).
  async obtenerResumenMensual(productorId) {
    const rows = await db.query(
      `SELECT resumen_mensual_ia AS texto, resumen_mensual_at AS generado_at FROM usuarios WHERE id = $1`,
      [productorId]
    );
    return rows[0] || { texto: null, generado_at: null };
  }

  // Para el cron mensual: regenera el resumen de todos los productores con actividad.
  async regenerarTodosLosResumenes() {
    const productores = await db.query(
      `SELECT DISTINCT pr.productor_id AS id
       FROM productos pr
       JOIN detalles_pedido dp ON dp.producto_id = pr.id
       JOIN pedidos p ON p.id = dp.pedido_id
       WHERE p.fecha_pedido > NOW() - INTERVAL '60 days'`
    );
    let ok = 0;
    for (const { id } of productores) {
      try { await this.generarResumenMensual(id); ok++; }
      catch (e) { logger.warn?.(`Resumen mensual falló para productor ${id}: ${e.message}`); }
    }
    return ok;
  }
}

module.exports = new EstadisticaService();
