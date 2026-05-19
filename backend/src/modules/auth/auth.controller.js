// ============================================
// src/modules/auth/auth.controller.js - CONTROLADORES DE AUTENTICACIÓN
// ============================================
// Este archivo maneja las peticiones HTTP de autenticación

const authService = require('./auth.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const {
  successResponse,
  createdResponse
} = require('../../utils/response');
const logger = require('../../utils/logger');
const config = require('../../config/environment');

// ============================================
// HELPERS DE COOKIE
// ============================================
const COOKIE_NAME = 'token';

const cookieOptions = () => {
  const isProd = config.app.env === 'production';
  // Si en prod estás en distinto dominio backend↔frontend, sameSite=none requiere secure=true.
  return {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 días — alineado con expiresIn por defecto
    path:     '/',
  };
};

const setAuthCookie = (res, token) => {
  if (token) res.cookie(COOKIE_NAME, token, cookieOptions());
};

const clearAuthCookie = (res) => {
  // En clearCookie hay que repetir las mismas options de path/sameSite/secure.
  const { httpOnly, secure, sameSite, path } = cookieOptions();
  res.clearCookie(COOKIE_NAME, { httpOnly, secure, sameSite, path });
};

// ============================================
// CONTROLADORES
// ============================================

/**
 * POST /api/auth/registro
 * Registrar un nuevo usuario
 */
const registro = asyncHandler(async (req, res) => {
  const { nombre, email, password, telefono, rol_id } = req.body;
  
  logger.info('Intento de registro', {
    email,
    rol_id: rol_id || 3
  });
  
  // Llamar al service
  const resultado = await authService.registrarUsuario({
    nombre,
    email,
    password,
    telefono,
    rol_id: rol_id || 3  // Default: consumidor
  });
  
  logger.logAuth('registro', { email }, true);
  logger.logEvent('usuario_registrado', {
    userId: resultado.usuario.id,
    email,
    rol_id: resultado.usuario.rol_id
  });

  setAuthCookie(res, resultado.token);

  return createdResponse(
    res,
    resultado,
    'Usuario registrado correctamente'
  );
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'] || 'Navegador desconocido';
  
  logger.info('Intento de login', { email });
  
  // Llamar al service
  const resultado = await authService.iniciarSesion({
    email,
    password,
    userAgent
  });
  
  logger.logAuth('login', { email }, true);
  logger.logEvent('login_exitoso', {
    userId: resultado.usuario.id,
    email
  });

  setAuthCookie(res, resultado.token);

  return successResponse(
    res,
    resultado,
    'Inicio de sesión exitoso'
  );
});

/**
 * GET /api/auth/verificar
 * Verificar token JWT (lee de cookie httpOnly o de Authorization header)
 */
const verificar = asyncHandler(async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    logger.warn('Intento de verificación sin token');
    return res.status(401).json({ error: 'No autorizado' });
  }

  logger.debug('Verificando token');

  const usuario = await authService.verificarToken(token);

  return successResponse(
    res,
    { usuario },
    'Token válido'
  );
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (registrar actividad y limpiar cookie)
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  const userAgent = req.headers['user-agent'] || 'Navegador desconocido';

  if (token) {
    try {
      await authService.cerrarSesion(token, userAgent);
      logger.info('Logout exitoso');
    } catch (error) {
      logger.debug('Error en logout (ignorado)', { error: error.message });
    }
  }

  clearAuthCookie(res);

  return successResponse(
    res,
    null,
    'Sesión cerrada correctamente'
  );
});

// ============================================
// EXPORTAR CONTROLADORES
// ============================================

/**
 * PUT /api/auth/cambiar-password
 * Cambiar contraseña del usuario autenticado
 */
const cambiarPassword = asyncHandler(async (req, res) => {
  const { password_actual, nueva_password } = req.body;
  const userId = req.user?.id;

  if (!password_actual || !nueva_password) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
  }

  const resultado = await authService.cambiarPassword(userId, { password_actual, nueva_password });
  return successResponse(res, resultado, resultado.message);
});

/**
 * POST /api/auth/google
 * Login / registro con Google (solo consumidores)
 */
const loginGoogle = asyncHandler(async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ success: false, error: 'Token de Google requerido' });
  }

  logger.info('Intento de login con Google');

  const resultado = await authService.loginConGoogle(id_token);

  logger.logAuth('login_google', { email: resultado.usuario.email }, true);

  setAuthCookie(res, resultado.token);

  return successResponse(res, resultado, resultado.message);
});

module.exports = {
  registro,
  login,
  verificar,
  logout,
  loginGoogle,
  cambiarPassword,
};