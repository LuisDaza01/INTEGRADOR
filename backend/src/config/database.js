// ============================================
// src/config/database.js - CONFIGURACIÓN DE POSTGRESQL
// ============================================
// Este archivo maneja todas las conexiones a la base de datos
// Usa un "pool" de conexiones para mejor rendimiento

const { Pool } = require('pg');
const config = require('./environment');
const logger = require('../utils/logger');

// ============================================
// CREAR POOL DE CONEXIONES
// ============================================

/**
 * Pool de conexiones a PostgreSQL
 * 
 * ¿Por qué usar un pool?
 * - Las conexiones a BD son caras de crear/destruir
 * - El pool reutiliza conexiones existentes
 * - Mejor rendimiento en producción
 * - Maneja múltiples peticiones concurrentes
 * 
 * Configuración:
 * - min: Conexiones mínimas siempre abiertas
 * - max: Conexiones máximas permitidas
 * - idleTimeoutMillis: Tiempo antes de cerrar conexión inactiva
 * - connectionTimeoutMillis: Tiempo máximo esperando conexión
 */
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  
  // Pool settings
  min: config.database.poolMin,              // Mínimo 2 conexiones
  max: config.database.poolMax,              // Máximo 20 conexiones
  idleTimeoutMillis: config.database.idleTimeout,           // 30 segundos
  connectionTimeoutMillis: config.database.connectionTimeout, // 2 segundos
  
  // Configuraciones adicionales
  application_name: 'naturapiscis_api',      // Nombre para identificar en logs de PostgreSQL
  
  // SSL en producción (opcional)
  ssl: config.app.env === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// EVENTOS DEL POOL
// ============================================
// El pool emite eventos útiles para debugging y monitoreo

/**
 * Evento: connect
 * Se dispara cuando se establece una nueva conexión
 */
pool.on('connect', (client) => {
  logger.debug('🔌 Nueva conexión establecida al pool de PostgreSQL', {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount
  });
});

/**
 * Evento: acquire
 * Se dispara cuando un cliente adquiere una conexión del pool
 */
pool.on('acquire', (client) => {
  logger.debug('📥 Cliente adquirió conexión del pool', {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingConnections: pool.waitingCount
  });
});

/**
 * Evento: remove
 * Se dispara cuando se remueve una conexión del pool
 */
pool.on('remove', (client) => {
  logger.debug('📤 Conexión removida del pool', {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount
  });
});

/**
 * Evento: error
 * Se dispara cuando hay un error inesperado en el pool
 * CRÍTICO: Esto puede ocurrir si PostgreSQL se cae
 */
pool.on('error', (err, client) => {
  logger.error('💥 Error inesperado en el pool de PostgreSQL:', {
    error: err.message,
    stack: err.stack,
    code: err.code
  });
  
  // En caso de error crítico del pool, salir
  // El sistema de reinicio (PM2, Docker, etc) lo volverá a iniciar
  process.exit(-1);
});

// ============================================
// FUNCIONES HELPER DEL POOL
// ============================================

/**
 * Probar la conexión a la base de datos
 * Útil para verificar en el startup que todo está bien
 * 
 * @returns {Promise<boolean>} true si conectó, false si falló
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    
    // Ejecutar una query simple para verificar
    const result = await client.query('SELECT NOW() as now, version() as version');
    client.release();
    
    logger.info('✅ Conexión a PostgreSQL exitosa', {
      database: config.database.name,
      host: config.database.host,
      port: config.database.port,
      serverTime: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    
    return true;
    
  } catch (error) {
    logger.error('❌ Error al conectar con PostgreSQL:', {
      error: error.message,
      code: error.code,
      host: config.database.host,
      database: config.database.name
    });
    
    return false;
  }
};

/**
 * Ejecutar una consulta SQL
 * Wrapper simple para pool.query con logging
 * 
 * @param {string} text - Query SQL con placeholders ($1, $2, etc)
 * @param {Array} params - Parámetros de la query
 * @returns {Promise<Array>} Filas resultantes
 * 
 * @example
 * const users = await query('SELECT * FROM usuarios WHERE id = $1', [userId]);
 */
const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Loggear query solo en desarrollo o si toma más de 1 segundo
    if (config.app.env === 'development' || duration > 1000) {
      logger.debug('📊 Query ejecutada', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params.length > 0 ? params : undefined,
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    // Retornar solo las filas (más limpio)
    return result.rows;
    
  } catch (error) {
    logger.error('❌ Error ejecutando query:', {
      error: error.message,
      code: error.code,
      query: text.substring(0, 100),
      params
    });
    
    throw error;
  }
};

/**
 * Ejecutar una transacción
 * Útil cuando necesitas múltiples queries que deben ejecutarse todas o ninguna
 * 
 * @param {Function} callback - Función async con las queries de la transacción
 * @returns {Promise<*>} Resultado de la transacción
 * 
 * @example
 * const result = await transaction(async (tx) => {
 *   await tx.query('INSERT INTO usuarios ...', [datos]);
 *   await tx.query('INSERT INTO productores ...', [datos]);
 *   return { success: true };
 * });
 */
const transaction = async (callback) => {
  // Obtener una conexión del pool
  const client = await pool.connect();
  
  try {
    // Iniciar transacción
    await client.query('BEGIN');
    logger.debug('🔄 Transacción iniciada');
    
    // Crear objeto tx con método query
    const tx = {
      query: (text, params) => client.query(text, params).then(res => res.rows)
    };
    
    // Ejecutar el callback con el objeto tx
    const result = await callback(tx);
    
    // Si todo salió bien, hacer COMMIT
    await client.query('COMMIT');
    logger.debug('✅ Transacción completada exitosamente');
    
    return result;
    
  } catch (error) {
    // Si hubo error, hacer ROLLBACK
    await client.query('ROLLBACK');
    logger.error('❌ Transacción revertida por error:', {
      error: error.message,
      code: error.code
    });
    
    throw error;
    
  } finally {
    // SIEMPRE liberar la conexión de vuelta al pool
    client.release();
  }
};

/**
 * Obtener un cliente del pool
 * Para operaciones avanzadas que necesitan control fino
 * 
 * IMPORTANTE: Siempre llamar client.release() cuando termines
 * 
 * @returns {Promise<PoolClient>}
 * 
 * @example
 * const client = await getClient();
 * try {
 *   const result = await client.query('SELECT ...');
 * } finally {
 *   client.release(); // ¡Muy importante!
 * }
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Cerrar todas las conexiones del pool
 * Se llama al hacer graceful shutdown del servidor
 * 
 * @returns {Promise<void>}
 */
const end = async () => {
  try {
    await pool.end();
    logger.info('🔌 Pool de conexiones cerrado correctamente', {
      totalConnectionsClosed: pool.totalCount
    });
  } catch (error) {
    logger.error('❌ Error al cerrar el pool de conexiones:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas del pool
 * Útil para monitoreo y debugging
 * 
 * @returns {Object} Estadísticas actuales del pool
 * 
 * @example
 * const stats = getPoolStats();
 * console.log(`Total: ${stats.total}, Idle: ${stats.idle}, Waiting: ${stats.waiting}`);
 */
const getPoolStats = () => {
  return {
    total: pool.totalCount,       // Total de conexiones en el pool
    idle: pool.idleCount,          // Conexiones inactivas disponibles
    waiting: pool.waitingCount     // Clientes esperando una conexión
  };
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
  pool,              // Pool completo (para casos avanzados)
  query,             // Ejecutar query simple
  transaction,       // Ejecutar transacción
  getClient,         // Obtener cliente del pool
  testConnection,    // Probar conexión
  end,               // Cerrar pool
  getPoolStats       // Obtener estadísticas
};