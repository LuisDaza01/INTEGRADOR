// validation.middleware.js - Middleware para validación de datos
const { validationResult } = require('express-validator');

/**
 * Middleware para procesar validaciones de express-validator
 * Captura errores de validación y los retorna en formato estándar
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = { validate };