// ============================================
// src/app.js - CONFIGURACIÓN DE EXPRESS
// ============================================

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const config = require('./config/environment');
const logger = require('./utils/logger');

const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const routes = require('./routes');

const app = express();

// ============================================
// CORS - DEBE IR ANTES QUE HELMET
// ============================================

app.use(cors(config.cors));

// Manejo explícito de preflight OPTIONS en TODAS las rutas
app.options('*', cors(config.cors));

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// ============================================
// MIDDLEWARES DE PARSEO
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// COMPRESIÓN
// ============================================

app.use(compression());

// ============================================
// LOGGING
// ============================================

if (config.app.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip: (req) => req.originalUrl === '/health'
  }));
}

// ============================================
// RATE LIMITING
// ============================================

app.use(apiLimiter);

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================

// Assets legacy: requieren autenticación para evitar enumeración pública.
// Los uploads nuevos van a Cloudinary (multer-storage-cloudinary).
const { isAuthenticated } = require('./middlewares/auth.middleware');
app.use('/uploads', isAuthenticated, express.static(path.join(__dirname, '../uploads')));

// ============================================
// HEADER PERSONALIZADO
// ============================================

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'NaturaPiscis API');
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: config.app.env,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    version: require('../package.json').version
  });
});

// ============================================
// RUTA RAÍZ
// ============================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a NaturaPiscis API',
    version: '1.0.0',
    documentation: `${config.app.url}${config.app.apiPrefix}`,
    endpoints: {
      health: '/health',
      api: config.app.apiPrefix,
      docs: `${config.app.apiPrefix}/docs`
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// RUTAS PRINCIPALES
// ============================================

app.use(config.app.apiPrefix, routes);

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;