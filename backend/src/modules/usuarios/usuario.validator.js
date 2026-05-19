// ============================================
// src/modules/usuarios/usuario.validator.js
// ============================================

const { body } = require('express-validator');

const validarActualizarPerfil = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email no es válido'),

  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede tener más de 20 caracteres'),

  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La dirección no puede tener más de 255 caracteres'),
];

module.exports = {
  validarActualizarPerfil,
};
