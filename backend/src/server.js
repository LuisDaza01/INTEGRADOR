// ============================================
// src/server.js - ENTRY POINT DEL SERVIDOR
// ============================================

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/environment');
const logger = require('./utils/logger');
const db = require('./config/database');
const { initSocket } = require('./socket/chat.socket');

process.on('uncaughtException', (error) => {
  logger.error('💥 UNCAUGHT EXCEPTION - El servidor se cerrará', {
    error: error.message,
    stack: error.stack
  });
  setTimeout(() => { process.exit(1); }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 UNHANDLED REJECTION - El servidor se cerrará', {
    reason,
    promise
  });
  setTimeout(() => { process.exit(1); }, 1000);
});

async function startServer() {
  try {
    logger.info('🔌 Verificando conexión a PostgreSQL...');
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    logger.info('✅ Conexión a PostgreSQL establecida correctamente');

    // Asegurar columna foto_portada existe (safe migration)
    try {
      await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_portada TEXT`);
      logger.info('✅ Columna foto_portada verificada');
    } catch (e) {
      logger.warn('⚠️ No se pudo verificar columna foto_portada:', e.message);
    }

    try {
      await db.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comprobante_url TEXT`);
      logger.info('✅ Columna comprobante_url verificada');
    } catch (e) {
      logger.warn('⚠️ No se pudo verificar columna comprobante_url:', e.message);
    }

    // Migraciones idempotentes de features recientes (reservas multi-ítem, verificación de pago).
    // Se ejecutan una por una (el wrapper db.query usa protocolo parametrizado y no admite
    // múltiples sentencias). Todas usan IF NOT EXISTS / DROP NOT NULL → seguras en cada arranque.
    const safeMigrations = [
      `ALTER TABLE reservas ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE`,
      `ALTER TABLE reservas ALTER COLUMN producto_id DROP NOT NULL`,
      `ALTER TABLE reservas ALTER COLUMN cantidad DROP NOT NULL`,
      `ALTER TABLE reservas ADD COLUMN IF NOT EXISTS ultimo_recordatorio_dias INTEGER`,
      `CREATE TABLE IF NOT EXISTS reserva_items (
         id                 SERIAL PRIMARY KEY,
         reserva_id         INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
         producto_id        INTEGER NOT NULL REFERENCES productos(id),
         modo               VARCHAR(10) NOT NULL DEFAULT 'cantidad',
         cantidad           NUMERIC(10,2) NOT NULL DEFAULT 1,
         peso_solicitado_kg NUMERIC(10,2),
         precio_estimado    NUMERIC(10,2),
         fecha_creacion     TIMESTAMP DEFAULT NOW()
       )`,
      `CREATE INDEX IF NOT EXISTS idx_reserva_items_reserva ON reserva_items(reserva_id)`,
      `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_verificado BOOLEAN DEFAULT false`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS resumen_mensual_ia TEXT`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS resumen_mensual_at TIMESTAMP`,
      `ALTER TABLE pedidos  ADD COLUMN IF NOT EXISTS eta_estimada      TIMESTAMP`,
    ];
    for (const sql of safeMigrations) {
      try {
        await db.query(sql);
      } catch (e) {
        logger.warn('⚠️ Safe migration falló (continuando):', e.message);
      }
    }
    logger.info('✅ Migraciones de reservas/pago verificadas');

    // Attach Socket.IO to HTTP server
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        // Refleja el origen del cliente para que la cookie httpOnly viaje
        // (no se puede usar '*' junto con credentials).
        origin: (origin, cb) => cb(null, origin || true),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
    initSocket(io);

    const { initScheduler } = require('./services/scheduler');
    initScheduler();

    const { startSensorBridge } = require('./services/sensorBridge');
    startSensorBridge();

    // ✅ '0.0.0.0' para aceptar conexiones desde el emulador y dispositivos en la red
    const server = httpServer.listen(config.app.port, '0.0.0.0', () => {
      logger.info(`
╔════════════════════════════════════════════════╗
║   🐟 NATURAPISCIS API - SERVIDOR INICIADO 🐟   ║
╠════════════════════════════════════════════════╣
║  Entorno: ${config.app.env.padEnd(37)} ║
║  Puerto: ${config.app.port.toString().padEnd(38)} ║
║  URL: http://0.0.0.0:${config.app.port.toString().padEnd(27)} ║
║  API Prefix: ${config.app.apiPrefix.padEnd(31)} ║
╠════════════════════════════════════════════════╣
║  📚 Documentación: /api                        ║
║  ❤️  Health Check: /health                     ║
╚════════════════════════════════════════════════╝
      `);
      
      logger.info('🚀 Servidor listo para recibir peticiones');
    });

    server.timeout = 30000;
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('❌ Error crítico al iniciar el servidor:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

function setupGracefulShutdown(server) {
  const gracefulShutdown = (signal) => {
    logger.info(`\n📡 ${signal} recibido. Iniciando cierre ordenado del servidor...`);
    
    server.close(async () => {
      logger.info('✅ Servidor HTTP cerrado - No se aceptan más peticiones');
      
      try {
        const { stopSensorBridge } = require('./services/sensorBridge');
        stopSensorBridge();
        await db.end();
        logger.info('✅ Conexión a PostgreSQL cerrada correctamente');
        logger.info('👋 Servidor cerrado exitosamente. ¡Hasta pronto!');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error al cerrar conexión a la base de datos:', error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('⚠️  No se pudo cerrar el servidor ordenadamente. Forzando cierre...');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => {
    logger.info('🔄 Nodemon reiniciando...');
    gracefulShutdown('SIGUSR2');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };