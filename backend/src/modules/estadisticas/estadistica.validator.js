// estadistica.validator.js - Validaciones para Estadísticas
const { query } = require('express-validator');

const estadisticaValidator = {
  /**
   * Validación para filtros de estadísticas (futuro)
   */
  obtenerEstadisticas: [
    query('fecha_desde')
      .optional()
      .isISO8601()
      .withMessage('Fecha desde debe ser una fecha válida'),
    
    query('fecha_hasta')
      .optional()
      .isISO8601()
      .withMessage('Fecha hasta debe ser una fecha válida'),
    
    query('periodo')
      .optional()
      .isIn(['dia', 'semana', 'mes', 'año'])
      .withMessage('Período inválido. Debe ser: dia, semana, mes o año')
  ]
};

module.exports = estadisticaValidator;