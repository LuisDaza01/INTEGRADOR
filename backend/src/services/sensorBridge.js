// ============================================
// src/services/sensorBridge.js
// Firebase Realtime DB → PostgreSQL bridge (multi-laguna + alertas)
//
// Para cada laguna activa con codigo_dispositivo, se suscribe al path
// /sensores/{codigo_dispositivo} en Firebase y persiste cada lectura
// (throttled) en sensor_readings con su laguna_id. Detecta cuando un
// valor cruza el rango óptimo o el crítico y crea una notificación
// in-app + push al productor — solo cuando cambia de estado, para no
// hacer spam si la lectura sigue fuera de rango.
// ============================================
const { getDatabase } = require('../config/firebaseAdmin');
const db = require('../config/database');
const logger = require('../utils/logger');
const notifService = require('../modules/notificaciones/notificacion.service');
const { sendPushNotification } = require('./pushNotifications');

const INSERT_INTERVAL_MS = 30_000; // un INSERT por laguna cada 30 s

// Umbrales sincronizados con NaturaPiscisApp/src/config/firebase.js → SENSOR_THRESHOLDS
const THRESHOLDS = {
  temperatura: { ok: [25, 34],   critical_above: 36, unit: '°C', label: 'Temperatura' },
  ph:          { ok: [6.5, 8.5], critical_below: 5.5, critical_above: 9.5, label: 'pH', unit: '' },
  turbidez:    { ok: [0,  50],   critical_above: 100, unit: 'NTU', label: 'Turbidez' },
  // nivel: lectura booleana/ok-low — se evalúa aparte si llega
};

// Estado en memoria para anti-spam: { [lagunaId]: { [sensor]: 'ok' | 'warning' | 'critical' } }
const lastAlertState = new Map();
// Throttle de insertion: { [lagunaId]: lastInsertTs }
const lastInsert = new Map();
// Listeners activos para poder limpiar al stop
const listeners = []; // [{ ref, handler }]

// ── Clasifica un valor en 'ok' | 'warning' | 'critical' ──
function classify(sensor, value) {
  if (value == null || Number.isNaN(value)) return 'ok'; // sin dato, no alertamos
  const t = THRESHOLDS[sensor];
  if (!t) return 'ok';

  // Critical first
  if (t.critical_above != null && value >= t.critical_above) return 'critical';
  if (t.critical_below != null && value <= t.critical_below) return 'critical';

  // Warning: fuera del rango óptimo pero sin pasar critical
  if (t.ok) {
    const [lo, hi] = t.ok;
    if (value < lo || value > hi) return 'warning';
  }
  return 'ok';
}

// Mensaje legible para el productor
function buildMsg(sensor, value, status) {
  const t = THRESHOLDS[sensor];
  const u = t?.unit ? ` ${t.unit}` : '';
  const v = Number(value).toFixed(t?.unit === '' ? 2 : 1);
  if (status === 'critical') return `⚠️ ${t?.label || sensor} crítico: ${v}${u}`;
  if (status === 'warning')  return `🟡 ${t?.label || sensor} fuera de rango: ${v}${u}`;
  return `✅ ${t?.label || sensor} en rango: ${v}${u}`;
}

// ── Crea alerta si el estado cambió respecto al anterior ──
async function maybeAlert(laguna, data) {
  const prevForLaguna = lastAlertState.get(laguna.id) || {};
  const nextForLaguna = { ...prevForLaguna };

  const sensors = ['temperatura', 'ph', 'turbidez'];
  const cambios = []; // alertas a disparar

  for (const s of sensors) {
    const value = data[s] != null ? parseFloat(data[s]) : null;
    const status = classify(s, value);
    const prevStatus = prevForLaguna[s] || 'ok';
    nextForLaguna[s] = status;

    // Solo alertar si pasamos de ok → warning/critical, o de warning → critical
    const empeoró =
      (prevStatus === 'ok'      && (status === 'warning' || status === 'critical')) ||
      (prevStatus === 'warning' &&  status === 'critical');
    // O si volvió a ok después de algo malo (notificar recuperación una vez)
    const recuperó = prevStatus !== 'ok' && status === 'ok';

    if (empeoró || recuperó) {
      cambios.push({ sensor: s, status, value, prevStatus });
    }
  }

  lastAlertState.set(laguna.id, nextForLaguna);

  if (cambios.length === 0) return;

  // Crea una notificación combinada (1 push por evento, aunque hayan cruzado varios sensores)
  const principal = cambios.find(c => c.status === 'critical') || cambios.find(c => c.status === 'warning') || cambios[0];
  const isRecover = principal.status === 'ok';
  const titulo = isRecover
    ? `✅ ${laguna.nombre || 'Laguna'} recuperada`
    : (principal.status === 'critical'
        ? `🚨 ${laguna.nombre || 'Laguna'} en estado crítico`
        : `🟡 ${laguna.nombre || 'Laguna'} fuera de rango`);
  const mensaje = cambios.map(c => buildMsg(c.sensor, c.value, c.status)).join(' · ');

  try {
    await notifService.crear({
      usuario_id: laguna.productor_id,
      titulo,
      mensaje,
      tipo: 'sensor',
      data: { laguna_id: laguna.id, cambios },
    });
  } catch (e) { logger.warn('Notif sensor error', { error: e.message }); }

  // Push (best-effort)
  try {
    const tokenRow = await db.query(
      `SELECT expo_push_token FROM usuarios WHERE id = $1 AND expo_push_token IS NOT NULL`,
      [laguna.productor_id]
    );
    const token = tokenRow[0]?.expo_push_token;
    if (token) {
      // Crítico → canal 'alerts' (MAX importance + bypass DND).
      // Warning / recuperación → canal 'orders' (HIGH importance, no rompe el DND).
      const channelId = principal.status === 'critical' ? 'alerts' : 'orders';
      await sendPushNotification(token, titulo, mensaje, {
        type: 'sensor',
        lagunaId: laguna.id,
        status: principal.status,
        screen: 'Monitoring',
        channelId,
      });
    }
  } catch (e) { logger.warn('Push sensor error', { error: e.message }); }
}

// ── Guarda una lectura ──
async function saveReading(laguna, data) {
  const { temperatura, ph, turbidez, bomba, nivel, oxigeno } = data;
  await db.query(
    `INSERT INTO sensor_readings (laguna_id, temperatura, ph, turbidez, bomba, nivel, oxigeno)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      laguna.id,
      temperatura != null ? parseFloat(temperatura) : null,
      ph          != null ? parseFloat(ph)          : null,
      turbidez    != null ? parseFloat(turbidez)    : null,
      bomba === true,
      nivel    != null ? (typeof nivel === 'boolean' ? (nivel ? 1 : 0) : parseFloat(nivel))    : null,
      oxigeno  != null ? parseFloat(oxigeno)  : null,
    ]
  );
}

// ── Carga lagunas activas con código de dispositivo ──
async function cargarLagunasConSensor() {
  return db.query(
    `SELECT id, productor_id, nombre, codigo_dispositivo
     FROM lagunas
     WHERE codigo_dispositivo IS NOT NULL AND codigo_dispositivo <> '' AND COALESCE(activa, true) = true`
  );
}

// ── Suscribe un listener Firebase por laguna ──
function subscribeLaguna(firebaseDb, laguna) {
  const path = `/sensores/${laguna.codigo_dispositivo}`;
  const ref = firebaseDb.ref(path);

  const handler = async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Alertas SIEMPRE (cada lectura), pero la lógica anti-spam evita disparar repetido
    maybeAlert(laguna, data).catch(e => logger.warn('maybeAlert error', { error: e.message }));

    // Throttle de persistencia por laguna
    const now = Date.now();
    const last = lastInsert.get(laguna.id) || 0;
    if (now - last < INSERT_INTERVAL_MS) return;
    lastInsert.set(laguna.id, now);

    try {
      await saveReading(laguna, data);
    } catch (err) {
      logger.error(`❌ Error guardando sensor (laguna ${laguna.id}):`, err.message);
    }
  };

  ref.on('value', handler, (error) => {
    logger.error(`❌ Error en listener Firebase /${path}:`, error.message);
  });
  listeners.push({ ref, handler });
  logger.info(`📡 SensorBridge → suscrito a ${path} (laguna ${laguna.id} · ${laguna.nombre})`);
}

async function startSensorBridge() {
  try {
    const firebaseDb = getDatabase();
    const lagunas = await cargarLagunasConSensor();

    if (lagunas.length === 0) {
      logger.warn('⚠️ SensorBridge: ninguna laguna con codigo_dispositivo. Bridge inactivo.');
      return;
    }

    for (const laguna of lagunas) subscribeLaguna(firebaseDb, laguna);

    logger.info(`🔌 SensorBridge activo — ${lagunas.length} laguna(s) escuchadas`);
  } catch (error) {
    logger.error('❌ No se pudo iniciar SensorBridge:', error.message);
  }
}

function stopSensorBridge() {
  for (const { ref, handler } of listeners) {
    try { ref.off('value', handler); } catch (_) { /* ignore */ }
  }
  listeners.length = 0;
  lastInsert.clear();
  lastAlertState.clear();
  logger.info('🛑 SensorBridge detenido');
}

module.exports = { startSensorBridge, stopSensorBridge };
