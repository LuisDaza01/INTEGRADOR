// productor.validator.js - Validaciones para Productores
const { body, param, query } = require('express-validator');

const productorValidator = {
  /**
   * Validación para obtener por ID
   */
  obtenerPorId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de productor inválido')
  ],

  /**
   * Validación para actualizar perfil
   */
  actualizarPerfil: [
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    
    body('telefono')
      .optional()
      .trim()
      .matches(/^[\d\s\+\-\(\)]+$/)
      .withMessage('Teléfono inválido'),
    
    body('ciudad')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),
    
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    
    body('nombre_empresa')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('El nombre de empresa no puede exceder 200 caracteres'),
    
    body('years_experience')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Los años de experiencia deben ser entre 0 y 100'),
    
    body('sitio_web')
      .optional()
      .trim()
      .isURL()
      .withMessage('URL del sitio web inválida'),
    
    body('perfil_publico')
      .optional()
      .isBoolean()
      .withMessage('perfil_publico debe ser verdadero o falso'),
    
    body('mostrar_telefono')
      .optional()
      .isBoolean()
      .withMessage('mostrar_telefono debe ser verdadero o falso'),
    
    body('mostrar_email')
      .optional()
      .isBoolean()
      .withMessage('mostrar_email debe ser verdadero o falso'),
    
    body('mostrar_direccion')
      .optional()
      .isBoolean()
      .withMessage('mostrar_direccion debe ser verdadero o falso'),
    
    body('dias_venta')
      .optional(),
    
    body('dias_envio')
      .optional(),
    
    body('especialidades')
      .optional()
      .isArray()
      .withMessage('especialidades debe ser un arreglo'),
    
    body('certificaciones')
      .optional()
      .isArray()
      .withMessage('certificaciones debe ser un arreglo'),
    
    body('metodos_envio')
      .optional()
      .isArray()
      .withMessage('metodos_envio debe ser un arreglo'),
    
    body('galeria_criadero')
      .optional()
      .isArray()
      .withMessage('galeria_criadero debe ser un arreglo')
  ],

  /**
   * Validación para búsqueda
   */
  buscar: [
    query('q')
      .notEmpty()
      .withMessage('El término de búsqueda es obligatorio')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El término debe tener entre 2 y 100 caracteres')
  ]
};

module.exports = productorValidator;