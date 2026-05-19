// ============================================
// src/middlewares/auth.middleware.js - AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================

const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { ROLES, hasPermission, isAdmin } = require('../constants/roles');
const { ERROR_MESSAGES } = require('../constants/messages');

// ============================================
// HELPER: extraer token de cookie o Authorization header
// ============================================
const extractToken = (req) => {
  // 1) Cookie httpOnly (frontend web)
  if (req.cookies && req.cookies.token) {
    return { token: req.cookies.token, source: 'cookie' };
  }
  // 2) Authorization: Bearer <token> (mobile / clientes API)
  const authHeader = req.headers.authorization;
  if (!authHeader) return { token: null };
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { token: null, malformed: true };
  }
  return { token: parts[1], source: 'header' };
};

// ============================================
// MIDDLEWARE: isAuthenticated
// ============================================
const isAuthenticated = async (req, res, next) => {
  try {
    const { token, malformed } = extractToken(req);

    if (malformed) {
      logger.warn('Formato de token incorrecto', { ip: req.ip });
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    if (!token) {
      logger.warn('Acceso sin token', { ip: req.ip, url: req.originalUrl });
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_REQUIRED);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.info('Token expirado', { ip: req.ip, expiredAt: error.expiredAt });
        throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Token invalido', { ip: req.ip, error: error.message });
        throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
      }
      throw error;
    }

    req.user = {
      id:           decoded.id,
      email:        decoded.email,
      rol:          decoded.rol,
      role_id:      decoded.role_id,
      productor_id: decoded.productor_id || null,
    };

    logger.debug('Usuario autenticado', {
      userId: req.user.id,
      rol:    req.user.rol,
      url:    req.originalUrl,
    });

    next();

  } catch (error) {
    next(error);
  }
};

// ============================================
// MIDDLEWARE: optionalAuth
// ============================================
const optionalAuth = async (req, res, next) => {
  try {
    const { token } = extractToken(req);
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        id:           decoded.id,
        email:        decoded.email,
        rol:          decoded.rol,
        role_id:      decoded.role_id,
        productor_id: decoded.productor_id || null,
      };
    } catch {
      // Token invalido en ruta opcional -> continuar sin usuario
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ============================================
// MIDDLEWARE: hasRole
// ============================================
const hasRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      if (!roles.includes(req.user.rol)) {
        logger.warn('Acceso denegado por rol insuficiente', {
          userId:        req.user.id,
          userRole:      req.user.rol,
          requiredRoles: roles,
          url:           req.originalUrl,
        });
        throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
      }

      logger.debug('Rol verificado', { userId: req.user.id, rol: req.user.rol });
      next();

    } catch (error) {
      next(error);
    }
  };
};

// ============================================
// MIDDLEWARE: isOwner
// ============================================
const isOwner = (paramName = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      if (isAdmin(req.user.rol)) return next();

      const resourceUserId = parseInt(req.params[paramName], 10);
      if (!resourceUserId) {
        throw new ForbiddenError('ID de usuario no proporcionado');
      }

      if (req.user.id !== resourceUserId) {
        logger.warn('Intento de acceso a recurso ajeno', {
          userId:         req.user.id,
          resourceUserId,
          url:            req.originalUrl,
        });
        throw new ForbiddenError(ERROR_MESSAGES.NOT_OWNER);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ============================================
// MIDDLEWARE: hasPermission
// ============================================
const hasPermissionMiddleware = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      if (!hasPermission(req.user.rol, permission)) {
        logger.warn('Acceso denegado por falta de permiso', {
          userId:             req.user.id,
          rol:                req.user.rol,
          permissionRequired: permission,
          url:                req.originalUrl,
        });
        throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Shortcuts de rol
const isAdminMiddleware      = (req, res, next) => hasRole(ROLES.ADMIN)(req, res, next);
const isProductorMiddleware  = (req, res, next) => hasRole(ROLES.PRODUCTOR)(req, res, next);
const isConsumidorMiddleware = (req, res, next) => hasRole(ROLES.CONSUMIDOR)(req, res, next);

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  isAuthenticated,
  optionalAuth,
  hasRole,
  isAdmin:       isAdminMiddleware,
  isProductor:   isProductorMiddleware,
  isConsumidor:  isConsumidorMiddleware,
  isOwner,
  hasPermission: hasPermissionMiddleware,
};