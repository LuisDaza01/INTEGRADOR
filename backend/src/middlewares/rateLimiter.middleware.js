// ============================================
// src/middlewares/rateLimiter.middleware.js - RATE LIMITING
// ============================================
// Este middleware protege la API contra:
// - Ataques de fuerza bruta
// - DDoS (Distributed Denial of Service)
// - Spam
// - Abuso de recursos

const rateLimit = require('express-rate-limit');
const config = require('../config/environment');
const logger = require('../utils/logger');
const { TooManyRequestsError } = require('../utils/errors');

// ============================================
// CONFIGURACIÓN BASE DE RATE LIMITING
// ============================================

/**
 * Configuración común para todos los rate limiters
 */
const rateLimitConfig = {
  windowMs: config.rateLimit.windowMs,  // Ventana de tiempo (15 minutos por defecto)
  
  // Handler personalizado cuando se excede el límite
  handler: (req, res, next) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('user-agent')
    });
    
    const error = new TooManyRequestsError(config.rateLimit.message);
    next(error);
  },
  
  // Generar clave única por IP
  // Puedes cambiarlo para usar userId si el usuario está autenticado
  keyGenerator: (req) => {
    // Si está autenticado, usar su ID
    if (req.user && req.user.id) {
      return `user_${req.user.id}`;
    }
    // Si no, usar IP
    return req.ip;
  },
  
  // Skip successful requests (opcional)
  skipSuccessfulRequests: false,
  
  // Skip failed requests (opcional)
  skipFailedRequests: false,
  
  // Mensaje personalizado en headers
  standardHeaders: true,  // Incluir `RateLimit-*` headers
  legacyHeaders: false    // Deshabilitar `X-RateLimit-*` headers
};

// ============================================
// RATE LIMITER GENERAL (API)
// ============================================

/**
 * Rate limiter general para toda la API
 * Protege contra ataques de fuerza bruta generales
 * 
 * Por defecto: 100 requests cada 15 minutos por IP
 * 
 * Se aplica a TODAS las rutas de la API en app.js
 */
const apiLimiter = rateLimit({
  ...rateLimitConfig,
  max: config.rateLimit.max,
  message: config.rateLimit.message,

  skip: (req) => {
    // Saltar health checks
    if (req.originalUrl === '/health' || req.originalUrl === '/') return true;
    // Saltar en desarrollo para IPs locales
    if (config.app.env !== 'production') {
      const ip = req.ip || '';
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) return true;
    }
    return false;
  }
});

// ============================================
// RATE LIMITER PARA AUTENTICACIÓN
// ============================================

/**
 * Rate limiter estricto para rutas de autenticación
 * Previene ataques de fuerza bruta en login
 * 
 * Límite: 5 intentos cada 15 minutos por IP
 * 
 * Uso: router.post('/login', authLimiter, loginController);
 */
const authLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                      // 5 intentos
  message: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos',
  
  // Solo contar requests fallidos para login
  skipSuccessfulRequests: true
});

// ============================================
// RATE LIMITER PARA REGISTRO
// ============================================

/**
 * Rate limiter para registro de usuarios
 * Previene creación masiva de cuentas (spam)
 * 
 * Límite: 3 registros cada hora por IP
 * 
 * Uso: router.post('/register', registerLimiter, registerController);
 */
const registerLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 3,                     // 3 registros
  message: 'Demasiados registros desde esta IP. Por favor intenta de nuevo en 1 hora'
});

// ============================================
// RATE LIMITER PARA CREACIÓN DE RECURSOS
// ============================================

/**
 * Rate limiter para operaciones de creación (POST)
 * Previene spam de creación de recursos
 * 
 * Límite: 20 creaciones cada 15 minutos
 * 
 * Uso: router.post('/productos', createLimiter, createController);
 */
const createLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 20,                    // 20 creaciones
  message: 'Demasiadas operaciones de creación. Por favor espera unos minutos'
});

// ============================================
// RATE LIMITER PARA BÚSQUEDAS
// ============================================

/**
 * Rate limiter para endpoints de búsqueda
 * Las búsquedas pueden ser costosas en la BD
 * 
 * Límite: 30 búsquedas cada 1 minuto
 * 
 * Uso: router.get('/productos/buscar', searchLimiter, searchController);
 */
const searchLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 1 * 60 * 1000,   // 1 minuto
  max: 30,                    // 30 búsquedas
  message: 'Demasiadas búsquedas. Por favor espera un momento'
});

// ============================================
// RATE LIMITER PARA UPLOADS
// ============================================

/**
 * Rate limiter para subida de archivos
 * Los uploads consumen mucho ancho de banda
 * 
 * Límite: 10 uploads cada 15 minutos
 * 
 * Uso: router.post('/upload', uploadLimiter, upload.single('file'), uploadController);
 */
const uploadLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 10,                    // 10 uploads
  message: 'Demasiadas subidas de archivos. Por favor espera unos minutos'
});

// ============================================
// RATE LIMITER PARA EMAILS
// ============================================

/**
 * Rate limiter para envío de emails
 * Previene spam de emails (recuperación de contraseña, etc)
 * 
 * Límite: 3 emails cada hora
 * 
 * Uso: router.post('/password-reset', emailLimiter, resetController);
 */
const emailLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 3,                     // 3 emails
  message: 'Demasiados emails enviados. Por favor intenta de nuevo en 1 hora'
});

// ============================================
// RATE LIMITER PARA VERIFICACIÓN DE EMAIL
// ============================================

/**
 * Rate limiter para reenvío de emails de verificación
 * 
 * Límite: 5 emails cada hora
 * 
 * Uso: router.post('/resend-verification', verificationLimiter, controller);
 */
const verificationLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 5,                     // 5 emails
  message: 'Demasiados intentos de reenvío. Por favor espera 1 hora'
});

// ============================================
// RATE LIMITER PERSONALIZADO
// ============================================

/**
 * Crear un rate limiter personalizado
 * Útil cuando necesitas configuración específica
 * 
 * @param {number} windowMinutes - Ventana de tiempo en minutos
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {string} message - Mensaje personalizado
 * @returns {Function} Rate limiter middleware
 * 
 * @example
 * const myLimiter = createCustomLimiter(5, 10, 'Demasiadas peticiones');
 * router.post('/mi-ruta', myLimiter, controller);
 */
const createCustomLimiter = (windowMinutes, maxRequests, message = null) => {
  return rateLimit({
    ...rateLimitConfig,
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: message || `Demasiadas peticiones. Por favor espera ${windowMinutes} minuto(s)`
  });
};

// ============================================
// RATE LIMITER PARA SENSORES IOT
// ============================================

/**
 * Rate limiter para datos de sensores IoT
 * Los sensores pueden enviar muchos datos
 * 
 * Límite: 1000 requests cada 15 minutos (aprox. 1 por segundo)
 * 
 * Uso: router.post('/sensores/data', sensorLimiter, sensorController);
 */
const sensorLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 1000,                  // 1000 requests
  message: 'Demasiados datos de sensores. Reducir frecuencia de envío',
  
  // Para sensores, usar un identificador específico
  keyGenerator: (req) => {
    // Usar sensor_id si está en el body
    if (req.body && req.body.sensor_id) {
      return `sensor_${req.body.sensor_id}`;
    }
    // Si no, usar IP
    return req.ip;
  }
});

// ============================================
// RATE LIMITER PARA REPORTES/ANALYTICS
// ============================================

/**
 * Rate limiter para endpoints de reportes y analytics
 * Estos endpoints pueden ser costosos computacionalmente
 * 
 * Límite: 10 reportes cada 15 minutos
 * 
 * Uso: router.get('/reportes/ventas', reportLimiter, reportController);
 */
const reportLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 10,                    // 10 reportes
  message: 'Demasiadas solicitudes de reportes. Por favor espera unos minutos'
});

// ============================================
// RATE LIMITER PARA ENDPOINTS DE IA (CLAUDE)
// ============================================

/**
 * Rate limiter para endpoints que invocan Claude (asistente, análisis de frescura).
 * Cada request tiene coste real en tokens, así que limitamos por usuario.
 *
 * Límite: 20 requests por hora por usuario.
 */
const aiLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Has alcanzado el límite de consultas a la IA. Intenta de nuevo en una hora.'
});

// ============================================
// EXPORTAR RATE LIMITERS
// ============================================

module.exports = {
  // General
  apiLimiter,

  // Autenticación y registro
  authLimiter,
  registerLimiter,
  verificationLimiter,

  // Operaciones
  createLimiter,
  searchLimiter,
  uploadLimiter,

  // Comunicaciones
  emailLimiter,

  // IoT
  sensorLimiter,

  // Analytics
  reportLimiter,

  // IA
  aiLimiter,

  // Helper
  createCustomLimiter
};