// ============================================
// src/utils/logger.js - SISTEMA DE LOGGING
// ============================================
// Este archivo configura Winston para logging profesional
// Maneja logs en archivos y consola con diferentes niveles

const winston = require('winston');
const path = require('path');
const config = require('../config/environment');

// ============================================
// NIVELES DE LOG
// ============================================

/**
 * Niveles de logging en orden de severidad:
 * 
 * error (0)   - Errores críticos que requieren atención inmediata
 * warn (1)    - Advertencias, posibles problemas
 * info (2)    - Información general del sistema
 * http (3)    - Logs de peticiones HTTP
 * debug (4)   - Información detallada para debugging
 * 
 * Cada nivel incluye todos los niveles superiores
 * Ejemplo: Si configuras 'info', también verás 'warn' y 'error'
 */

// ============================================
// FORMATO PERSONALIZADO
// ============================================

/**
 * Formato para desarrollo (legible por humanos)
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Si hay metadata adicional, añadirla
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

/**
 * Formato para producción (JSON estructurado)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================
// TRANSPORTS (DESTINOS DE LOGS)
// ============================================

/**
 * Console transport - Muestra logs en la consola
 */
const consoleTransport = new winston.transports.Console({
  format: config.app.env === 'development' ? devFormat : prodFormat
});

/**
 * File transport - Error logs
 * Guarda SOLO errores en archivo separado
 */
const errorFileTransport = new winston.transports.File({
  filename: path.join('logs', 'error.log'),
  level: 'error',
  format: prodFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5
});

/**
 * File transport - Combined logs
 * Guarda TODOS los logs en un archivo
 */
const combinedFileTransport = new winston.transports.File({
  filename: path.join('logs', 'combined.log'),
  format: prodFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5
});

/**
 * File transport - Exceptions
 * Guarda excepciones no capturadas
 */
const exceptionsTransport = new winston.transports.File({
  filename: path.join('logs', 'exceptions.log'),
  format: prodFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5
});

/**
 * File transport - Rejections
 * Guarda promesas rechazadas no manejadas
 */
const rejectionsTransport = new winston.transports.File({
  filename: path.join('logs', 'rejections.log'),
  format: prodFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5
});

// ============================================
// CREAR LOGGER
// ============================================

/**
 * Instancia principal del logger
 */
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  
  // Transports activos
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport
  ],
  
  // Manejo de excepciones
  exceptionHandlers: [
    consoleTransport,
    exceptionsTransport
  ],
  
  // Manejo de promesas rechazadas
  rejectionHandlers: [
    consoleTransport,
    rejectionsTransport
  ],
  
  // No salir en caso de error
  exitOnError: false
});

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Log de peticiones HTTP
 * Útil para morgan o logging manual de requests
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {number} responseTime - Tiempo de respuesta en ms
 * 
 * @example
 * logger.logRequest(req, res, 150);
 */
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Si está autenticado, incluir usuario
  if (req.user) {
    logData.userId = req.user.id;
  }
  
  // Log según status code
  if (res.statusCode >= 500) {
    logger.error('HTTP Request - Server Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request - Client Error', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

/**
 * Log de respuestas exitosas
 * 
 * @param {string} message - Mensaje descriptivo
 * @param {Object} data - Datos adicionales
 * 
 * @example
 * logger.logResponse('Producto creado', { productId: 123 });
 */
logger.logResponse = (message, data = {}) => {
  logger.info(message, data);
};

/**
 * Log de errores con contexto
 * 
 * @param {string} message - Mensaje del error
 * @param {Error} error - Objeto error
 * @param {Object} context - Contexto adicional
 * 
 * @example
 * logger.logError('Error al crear producto', error, { userId: 123 });
 */
logger.logError = (message, error, context = {}) => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

/**
 * Log de operaciones de base de datos
 * 
 * @param {string} operation - Tipo de operación (SELECT, INSERT, etc)
 * @param {string} table - Tabla afectada
 * @param {number} duration - Duración en ms
 * @param {Object} details - Detalles adicionales
 * 
 * @example
 * logger.logDatabase('SELECT', 'productos', 45, { rows: 10 });
 */
logger.logDatabase = (operation, table, duration, details = {}) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`,
    ...details
  };
  
  // Log si toma más de 1 segundo
  if (duration > 1000) {
    logger.warn('Slow Database Query', logData);
  } else {
    logger.debug('Database Query', logData);
  }
};

/**
 * Log de autenticación
 * 
 * @param {string} action - Acción (login, logout, register, etc)
 * @param {Object} user - Datos del usuario
 * @param {boolean} success - Si fue exitoso
 * @param {string} reason - Razón (si falló)
 * 
 * @example
 * logger.logAuth('login', { email: 'user@test.com' }, true);
 * logger.logAuth('login', { email: 'user@test.com' }, false, 'Contraseña incorrecta');
 */
logger.logAuth = (action, user, success, reason = null) => {
  const logData = {
    action,
    email: user.email || user.id,
    success
  };
  
  if (!success && reason) {
    logData.reason = reason;
  }
  
  if (success) {
    logger.info('Authentication Event', logData);
  } else {
    logger.warn('Authentication Failed', logData);
  }
};

/**
 * Log de eventos del sistema
 * 
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos del evento
 * 
 * @example
 * logger.logEvent('server_started', { port: 3001 });
 * logger.logEvent('database_connected', { host: 'localhost' });
 */
logger.logEvent = (event, data = {}) => {
  logger.info(`System Event: ${event}`, data);
};

/**
 * Log de validación fallida
 * 
 * @param {string} resource - Recurso validado
 * @param {Array} errors - Lista de errores
 * 
 * @example
 * logger.logValidation('producto', [
 *   { field: 'nombre', message: 'Nombre requerido' }
 * ]);
 */
logger.logValidation = (resource, errors) => {
  logger.warn('Validation Failed', {
    resource,
    errors
  });
};

/**
 * Log de seguridad
 * 
 * @param {string} event - Evento de seguridad
 * @param {Object} details - Detalles del evento
 * 
 * @example
 * logger.logSecurity('rate_limit_exceeded', { ip: '192.168.1.1' });
 * logger.logSecurity('unauthorized_access', { userId: 123, resource: 'admin' });
 */
logger.logSecurity = (event, details = {}) => {
  logger.warn(`Security Event: ${event}`, details);
};

/**
 * Log de debugging detallado
 * Solo se muestra cuando LOG_LEVEL=debug
 * 
 * @param {string} message - Mensaje de debug
 * @param {Object} data - Datos adicionales
 * 
 * @example
 * logger.logDebug('Request body', req.body);
 */
logger.logDebug = (message, data = {}) => {
  logger.debug(message, data);
};

// ============================================
// STREAM PARA MORGAN
// ============================================

/**
 * Stream para integrar con Morgan (HTTP logger)
 * Morgan escribirá en este stream y Winston lo procesará
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// ============================================
// MENSAJES DE INICIO
// ============================================

// Solo en desarrollo
if (config.app.env === 'development') {
  logger.info('📝 Logger inicializado', {
    level: config.logging.level,
    format: config.logging.format,
    transports: ['console', 'file']
  });
}

// ============================================
// EXPORTAR LOGGER
// ============================================

module.exports = logger;