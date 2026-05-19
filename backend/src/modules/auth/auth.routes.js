// ============================================
// src/modules/auth/auth.routes.js - RUTAS DE AUTENTICACIÓN
// ============================================
// Migrado desde api-auth-routes.js con nueva arquitectura

const express = require('express');
const router = express.Router();

// Importar controladores
const authController = require('./auth.controller');

// Importar validadores
const {
  validateRegistro,
  validateLogin,
  validateToken
} = require('./auth.validator');

// Importar middleware de validación
const { validateRequest } = require('../../middlewares/error.middleware');

// Importar rate limiters
const {
  authLimiter,
  registerLimiter
} = require('../../middlewares/rateLimiter.middleware');

// ============================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================

/**
 * POST /api/auth/registro
 * Registrar un nuevo usuario
 * 
 * Body:
 * - nombre: string (requerido)
 * - email: string (requerido)
 * - password: string (requerido, min 6 chars)
 * - telefono: string (opcional)
 * - rol_id: number (opcional, default: 3 = consumidor)
 */
router.post(
  '/registro',
  registerLimiter,  // Rate limit: 3 registros por hora
  validateRegistro,
  validateRequest,
  authController.registro
);

/**
 * POST /api/auth/login
 * Iniciar sesión
 * 
 * Body:
 * - email: string (requerido)
 * - password: string (requerido)
 * 
 * Response:
 * - token: JWT token
 * - usuario: Datos del usuario
 */
router.post(
  '/login',
  authLimiter,  // Rate limit: 5 intentos cada 15 minutos
  validateLogin,
  validateRequest,
  authController.login
);

/**
 * GET /api/auth/verificar
 * Verificar si el token es válido
 * 
 * Headers:
 * - Authorization: Bearer TOKEN
 * 
 * Response:
 * - usuario: Datos del usuario
 */
router.get(
  '/verificar',
  validateToken,
  authController.verificar
);

/**
 * POST /api/auth/logout
 * Cerrar sesión (registrar actividad)
 * 
 * Headers:
 * - Authorization: Bearer TOKEN (opcional)
 * 
 * Response:
 * - message: Confirmación
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * POST /api/auth/google
 * Login o registro con cuenta Google (solo consumidores)
 */
router.post(
  '/google',
  authLimiter,
  authController.loginGoogle
);

/**
 * PUT /api/auth/cambiar-password
 * Cambiar contraseña (requiere autenticación)
 */
const { isAuthenticated } = require('../../middlewares/auth.middleware');
router.put(
  '/cambiar-password',
  isAuthenticated,
  authController.cambiarPassword
);

// ============================================
// EXPORTAR ROUTER
// ============================================

module.exports = router;