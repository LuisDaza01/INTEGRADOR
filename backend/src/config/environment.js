// ============================================
// src/config/environment.js - VARIABLES DE ENTORNO
// ============================================

require('dotenv').config();

const config = {

  app: {
    name: process.env.APP_NAME || 'NaturaPiscis API',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3001,
    apiPrefix: process.env.API_PREFIX || '/api',
    url: process.env.APP_URL || 'http://localhost:3001'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'naturapiscis',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000
  },

  jwt: {
    secret: (() => {
      const s = process.env.JWT_SECRET;
      console.log('[ENV] JWT_SECRET presente:', !!s, '| longitud:', s ? s.length : 0, '| NODE_ENV:', process.env.NODE_ENV);
      if (!s || s === 'naturapiscis_secret_key_change_in_production') {
        console.warn('⚠️  JWT_SECRET no configurado o usa valor por defecto.');
      }
      return s || 'naturapiscis_secret_key_change_in_production';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: (() => {
      const s = process.env.JWT_REFRESH_SECRET;
      if (!s || s === 'refresh_secret_change_in_production') {
        console.warn('⚠️  JWT_REFRESH_SECRET no configurado.');
      }
      return s || 'refresh_secret_change_in_production';
    })(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  cors: {
    origin: (origin, callback) => {
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
      // Defaults: localhost para dev + Railway frontend si está configurado
      const defaults = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:19006',
        'exp://localhost:19000',
      ];
      const whitelist = allowed.length ? [...defaults, ...allowed] : defaults;
      // Permitir requests sin origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Permitir todos los dominios de Railway
      if (origin.endsWith('.railway.app')) return callback(null, true);
      if (whitelist.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origen no permitido — ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
    // En desarrollo: 2000 req/ventana; en producción: 100 (o lo que diga .env)
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || (process.env.NODE_ENV === 'production' ? 100 : 2000),
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde'
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif'
    ],
    destination: process.env.UPLOAD_PATH || './uploads'
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@naturapiscis.com'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  pagination: {
    defaultPage: parseInt(process.env.PAGINATION_DEFAULT_PAGE, 10) || 1,
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT, 10) || 10,
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT, 10) || 100
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};

const validateConfig = () => {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET no configurado — usando valor por defecto.');
  }
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.warn('⚠️  Sin configuración de base de datos explícita.');
  }
};

const showConfigInfo = () => {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║         📋 CONFIGURACIÓN DEL SERVIDOR 📋       ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║  Entorno: ${config.app.env.padEnd(38)} ║`);
  console.log(`║  Puerto: ${config.app.port.toString().padEnd(39)} ║`);
  console.log(`║  Base de Datos: ${config.database.name.padEnd(30)} ║`);
  console.log(`║  DB Host: ${config.database.host.padEnd(36)} ║`);
  console.log(`║  Pool Conexiones: ${config.database.poolMin}-${config.database.poolMax.toString().padEnd(26)} ║`);
  console.log(`║  Rate Limit: ${config.rateLimit.max.toString().padEnd(33)} req/ventana ║`);
  console.log('╚════════════════════════════════════════════════╝\n');
};

validateConfig();

if (config.app.env !== 'test') {
  showConfigInfo();
}

module.exports = config;