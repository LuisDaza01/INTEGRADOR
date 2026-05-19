// Scheduler simple — usa setInterval sin dependencias externas
// Envía notificaciones de alimentación a las 06:00 y 18:00
// Verifica stock bajo y cosechas listas una vez al día

const db     = require('../config/database');
const logger = require('../utils/logger');
const { sendPushNotification } = require('./pushNotifications');
const pedidoRepository = require('../modules/pedidos/pedido.repository');
const reservaService   = require('../modules/reservas/reserva.service');

// ── Helpers ───────────────────────────────────────────────────────
const TIPOS_ALIMENTO = [
  { pesoMin: 1,   pesoMax: 5,    porcentajeBiomasa: 10, frecuenciaDia: 3 },
  { pesoMin: 5,   pesoMax: 20,   porcentajeBiomasa: 8,  frecuenciaDia: 3 },
  { pesoMin: 20,  pesoMax: 80,   porcentajeBiomasa: 6,  frecuenciaDia: 2 },
  { pesoMin: 80,  pesoMax: 150,  porcentajeBiomasa: 5,  frecuenciaDia: 2 },
  { pesoMin: 150, pesoMax: 350,  porcentajeBiomasa: 4,  frecuenciaDia: 2 },
  { pesoMin: 350, pesoMax: 550,  porcentajeBiomasa: 3,  frecuenciaDia: 2 },
  { pesoMin: 550, pesoMax: 99999,porcentajeBiomasa: 2,  frecuenciaDia: 2 },
];

function calcPesoActual(siembra) {
  const dias     = Math.max(0, Math.floor((Date.now() - new Date(siembra.fecha_siembra)) / 86400000));
  const progreso = Math.min(dias / siembra.duracion_dias, 1);
  return siembra.peso_inicial_g + (siembra.peso_objetivo_g - siembra.peso_inicial_g) * progreso;
}

function calcAlimento(siembra) {
  const pesoG    = calcPesoActual(siembra);
  const tipo     = TIPOS_ALIMENTO.find(t => pesoG >= t.pesoMin && pesoG < t.pesoMax) || TIPOS_ALIMENTO[6];
  const biomasaKg = (pesoG / 1000) * siembra.peces_actuales;
  const totalDia  = (biomasaKg * tipo.porcentajeBiomasa) / 100;
  return { totalDia: Math.round(totalDia * 10) / 10, porSesion: Math.round((totalDia / tipo.frecuenciaDia) * 10) / 10, frecuencia: tipo.frecuenciaDia };
}

// ── Consultas ─────────────────────────────────────────────────────
async function getSiembrasActivas() {
  return db.query(`
    SELECT s.*, l.nombre AS laguna_nombre, l.productor_id,
           u.push_token
    FROM siembras s
    JOIN lagunas l ON l.id = s.laguna_id
    JOIN usuarios u ON u.id = l.productor_id
    WHERE s.estado = 'activa' AND u.push_token IS NOT NULL
  `);
}

// ── Tarea: Notificación de alimentación ───────────────────────────
async function enviarNotificacionesAlimentacion() {
  try {
    const siembras = await getSiembrasActivas();
    if (!siembras.length) return;

    const hora = new Date().getHours();
    const sesion = hora < 12 ? 'mañana' : 'tarde';

    for (const s of siembras) {
      const alim = calcAlimento(s);
      await sendPushNotification(
        s.push_token,
        `🍽️ Hora de alimentar ${s.laguna_nombre}`,
        `Sesión de ${sesion}: ${alim.porSesion} kg de alimento`,
        { type: 'alimentacion', lagunaId: s.laguna_id, screen: 'Inventario' }
      );
    }
    logger.info(`[scheduler] Notificaciones de alimentación enviadas: ${siembras.length}`);
  } catch (e) {
    logger.error('[scheduler] Error en alimentacion:', e.message);
  }
}

// ── Tarea: Alertas de stock bajo y cosecha lista ──────────────────
async function verificarAlertas() {
  try {
    const siembras = await getSiembrasActivas();
    if (!siembras.length) return;

    for (const s of siembras) {
      const diasTranscurridos = Math.floor((Date.now() - new Date(s.fecha_siembra)) / 86400000);
      const diasRestantes     = s.duracion_dias - diasTranscurridos;
      const pctStock          = s.capacidad_maxima
        ? Math.round((s.peces_actuales / s.capacidad_maxima) * 100) : null;

      // Cosecha lista
      if (diasRestantes <= 0) {
        await sendPushNotification(
          s.push_token,
          `🎉 ${s.laguna_nombre} lista para cosechar`,
          `Los peces alcanzaron el peso objetivo. ¡Es momento de cosechar!`,
          { type: 'cosecha_lista', lagunaId: s.laguna_id, screen: 'Inventario' }
        );
        continue;
      }

      // Aviso 7 días antes de cosecha
      if (diasRestantes === 7) {
        await sendPushNotification(
          s.push_token,
          `⏰ ${s.laguna_nombre} — 7 días para cosechar`,
          `Planifica tu cosecha. Los peces estarán listos en 1 semana.`,
          { type: 'cosecha_proxima', lagunaId: s.laguna_id, screen: 'Inventario' }
        );
      }

      // Stock crítico (<10% de capacidad)
      if (pctStock !== null && pctStock < 10) {
        await sendPushNotification(
          s.push_token,
          `🔴 Stock crítico en ${s.laguna_nombre}`,
          `Quedan ${s.peces_actuales} peces (${pctStock}%). Considera planificar nueva siembra.`,
          { type: 'stock_critico', lagunaId: s.laguna_id, screen: 'Inventario' }
        );
      }
    }
    logger.info('[scheduler] Verificación de alertas completada');
  } catch (e) {
    logger.error('[scheduler] Error en alertas:', e.message);
  }
}

// ── Tarea: cancelar pedidos esperando_confirmacion expirados ──────
async function cancelarPedidosExpirados() {
  try {
    const cancelados = await pedidoRepository.cancelarExpirados();
    if (cancelados.length > 0) {
      logger.info(`[scheduler] Pedidos expirados cancelados: ${cancelados.length}`);
      // Notificación push best-effort
      for (const p of cancelados) {
        if (p.push_token) {
          sendPushNotification(
            p.push_token,
            '⏰ Tu pedido fue cancelado',
            'No confirmaste el precio a tiempo y el pedido se canceló.',
            { type: 'pedido_expirado', pedidoId: p.id, screen: 'MisPedidos' }
          ).catch(() => {});
        }
      }
    }
  } catch (e) {
    logger.error('[scheduler] Error cancelarPedidosExpirados:', e.message);
  }
}

// ── Tarea: expirar reservas pendientes vencidas ───────────────────
async function expirarReservasVencidas() {
  try {
    const expiradas = await reservaService.expirarVencidas();
    if (expiradas.length > 0) {
      logger.info(`[scheduler] Reservas expiradas: ${expiradas.length}`);
    }
  } catch (e) {
    logger.error('[scheduler] Error expirarReservasVencidas:', e.message);
  }
}

// ── Control de horario ────────────────────────────────────────────
let lastFeedingHour  = -1;
let lastAlertDay     = -1;

function tickLento() {
  const now    = new Date();
  const hour   = now.getHours();
  const day    = now.getDate();
  const minute = now.getMinutes();

  // Alimentación: 06:00 y 18:00 (ventana de 5 min)
  if ((hour === 6 || hour === 18) && minute < 5 && lastFeedingHour !== hour) {
    lastFeedingHour = hour;
    enviarNotificacionesAlimentacion();
  }

  // Alertas de stock/cosecha: una vez al día a las 07:00
  if (hour === 7 && minute < 5 && lastAlertDay !== day) {
    lastAlertDay = day;
    verificarAlertas();
  }
}

function tickRapido() {
  // Cada minuto: revisar timers expirados (pedidos y reservas)
  cancelarPedidosExpirados();
  expirarReservasVencidas();
}

// ── Inicialización ────────────────────────────────────────────────
function initScheduler() {
  // Cron lento: cada 2 min para alimentación/alertas
  setInterval(tickLento, 2 * 60 * 1000);
  // Cron rápido: cada 1 min para timers cortos (15 min de confirmación, expiración de reservas)
  setInterval(tickRapido, 60 * 1000);
  // Disparo inmediato al arrancar para limpiar lo acumulado
  tickRapido();
  logger.info('✅ Scheduler iniciado (alimentación 06:00 y 18:00, expiraciones cada 1 min)');
}

module.exports = { initScheduler };
