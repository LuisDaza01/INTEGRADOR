// ============================================
// src/modules/auth/auth.validator.js - VALIDACIONES
// ============================================

const { body, header } = require('express-validator');
const { VALIDATION_MESSAGES } = require('../../constants/messages');

const validateRegistro = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage(VALIDATION_MESSAGES.EMAIL_INVALID)
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6, max: 128 })
    .withMessage('La contraseña debe tener entre 6 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value) => {
      const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123'];
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('La contraseña es demasiado común');
      }
      return true;
    }),

  body('telefono')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage(VALIDATION_MESSAGES.PHONE_INVALID)
    .isLength({ min: 8, max: 20 })
    .withMessage('El teléfono debe tener entre 8 y 20 caracteres'),

  // ✅ Ahora permite rol_id 4 (repartidor)
  body('rol_id')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('El rol_id debe ser 1 (admin), 2 (productor), 3 (consumidor) o 4 (repartidor)')
    .toInt()
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage(VALIDATION_MESSAGES.EMAIL_INVALID)
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 1 })
    .withMessage('La contraseña no puede estar vacía')
];

const validateToken = [
  header('authorization')
    .notEmpty()
    .withMessage('El token de autorización es requerido')
    .matches(/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/)
    .withMessage('Formato de token inválido. Debe ser: Bearer <token>')
];

const validatePasswordChange = [
  body('password_actual')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),

  body('password_nueva')
    .notEmpty()
    .withMessage('La contraseña nueva es requerida')
    .isLength({ min: 6, max: 128 })
    .withMessage('La contraseña debe tener entre 6 y 128 caracteres')
    .custom((value, { req }) => {
      if (value === req.body.password_actual) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    }),

  body('password_confirmacion')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.password_nueva) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

const validatePasswordReset = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage(VALIDATION_MESSAGES.EMAIL_INVALID)
    .normalizeEmail()
];

const validateRefreshToken = [
  body('refresh_token')
    .notEmpty()
    .withMessage('El refresh token es requerido')
    .isString()
    .withMessage('El refresh token debe ser una cadena de texto')
];

const sanitizeEmail = (value) => {
  if (typeof value !== 'string') return value;
  return value.toLowerCase().trim().replace(/\s+/g, '');
};

const sanitizePhone = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
};

module.exports = {
  validateRegistro,
  validateLogin,
  validateToken,
  validatePasswordChange,
  validatePasswordReset,
  validateRefreshToken,
  sanitizeEmail,
  sanitizePhone
};