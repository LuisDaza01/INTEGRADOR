const { body, param } = require('express-validator');

const crearOpinion = [
  body('producto_id').isInt({ min: 1 }).withMessage('producto_id debe ser un entero positivo'),
  body('calificacion').isInt({ min: 1, max: 5 }).withMessage('La calificación debe estar entre 1 y 5'),
  body('comentario')
    .optional()
    .isString().withMessage('El comentario debe ser texto')
    .isLength({ max: 1000 }).withMessage('El comentario no puede superar 1000 caracteres')
    .trim(),
];

const responderOpinion = [
  param('id').isInt({ min: 1 }).withMessage('ID de opinión inválido'),
  body('respuesta')
    .notEmpty().withMessage('La respuesta no puede estar vacía')
    .isString().withMessage('La respuesta debe ser texto')
    .isLength({ min: 1, max: 1000 }).withMessage('La respuesta no puede superar 1000 caracteres')
    .trim(),
];

module.exports = { crearOpinion, responderOpinion };
