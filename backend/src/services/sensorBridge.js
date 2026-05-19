// ============================================
// src/services/sensorBridge.js
// Firebase Realtime DB → PostgreSQL bridge
// ============================================
const { getDatabase } = require('../config/firebaseAdmin');
const db = require('../config/database');
const logger = require('../utils/logger');

const FIREBASE_PATH = 'laguna';
const INSERT_INTERVAL_MS = 30_000; // guarda un registro cada 30 segundos

let lastInsert = 0;
let bridgeListener = null;

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id          SERIAL PRIMARY KEY,
      timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      temperatura NUMERIC(5,2),
      ph          NUMERIC(4,2),
      turbidez    NUMERIC(6,2),
      bomba       BOOLEAN
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp
    ON sensor_readings (timestamp DESC)
  `);
  logger.info('✅ Tabla sensor_readings verificada');
}

async function saveReading(data) {
  const { temperatura, ph, turbidez, bomba } = data;
  await db.query(
    `INSERT INTO sensor_readings (temperatura, ph, turbidez, bomba)
     VALUES ($1, $2, $3, $4)`,
    [
      temperatura != null ? parseFloat(temperatura) : null,
      ph          != null ? parseFloat(ph)          : null,
      turbidez    != null ? parseFloat(turbidez)    : null,
      bomba === true,
    ]
  );
}

async function startSensorBridge() {
  try {
    await ensureTable();

    const firebaseDb = getDatabase();
    const ref = firebaseDb.ref(FIREBASE_PATH);

    bridgeListener = ref.on('value', async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const now = Date.now();
      if (now - lastInsert < INSERT_INTERVAL_MS) return; // throttle
      lastInsert = now;

      try {
        await saveReading(data);
        logger.info('📊 Sensor guardado en PostgreSQL', {
          temperatura: data.temperatura,
          ph: data.ph,
          turbidez: data.turbidez,
          bomba: data.bomba,
        });
      } catch (err) {
        logger.error('❌ Error guardando sensor en PostgreSQL:', err.message);
      }
    }, (error) => {
      logger.error('❌ Error en listener Firebase:', error.message);
    });

    logger.info(`🔌 SensorBridge activo — escuchando Firebase: /${FIREBASE_PATH}`);
  } catch (error) {
    logger.error('❌ No se pudo iniciar SensorBridge:', error.message);
  }
}

function stopSensorBridge() {
  if (bridgeListener) {
    const firebaseDb = getDatabase();
    firebaseDb.ref(FIREBASE_PATH).off('value', bridgeListener);
    bridgeListener = null;
    logger.info('🛑 SensorBridge detenido');
  }
}

module.exports = { startSensorBridge, stopSensorBridge };
