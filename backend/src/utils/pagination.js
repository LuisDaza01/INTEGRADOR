// ============================================
// src/utils/pagination.js - HELPERS DE PAGINACIÓN
// ============================================
// Este archivo contiene funciones para manejar paginación en queries
// Facilita la implementación consistente de paginación en toda la API

const config = require('../config/environment');

// ============================================
// CONSTANTES DE PAGINACIÓN
// ============================================

const DEFAULT_PAGE = config.pagination.defaultPage || 1;
const DEFAULT_LIMIT = config.pagination.defaultLimit || 10;
const MAX_LIMIT = config.pagination.maxLimit || 100;

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcular offset para la query SQL
 * offset = (page - 1) * limit
 * 
 * @param {number} page - Número de página (empieza en 1)
 * @param {number} limit - Items por página
 * @returns {number} Offset para la query
 * 
 * @example
 * const offset = getOffset(1, 10);  // 0
 * const offset = getOffset(2, 10);  // 10
 * const offset = getOffset(3, 10);  // 20
 */
const getOffset = (page, limit) => {
  return (page - 1) * limit;
};

/**
 * Calcular número total de páginas
 * totalPages = Math.ceil(total / limit)
 * 
 * @param {number} total - Total de registros
 * @param {number} limit - Items por página
 * @returns {number} Número total de páginas
 * 
 * @example
 * const totalPages = getTotalPages(100, 10);  // 10
 * const totalPages = getTotalPages(95, 10);   // 10
 * const totalPages = getTotalPages(5, 10);    // 1
 */
const getTotalPages = (total, limit) => {
  return Math.ceil(total / limit);
};

/**
 * Crear objeto de paginación completo
 * 
 * @param {number} page - Página actual
 * @param {number} limit - Items por página
 * @param {number} total - Total de registros
 * @returns {Object} Objeto de paginación
 * 
 * @example
 * const pagination = createPagination(2, 10, 100);
 * // {
 * //   page: 2,
 * //   limit: 10,
 * //   total: 100,
 * //   totalPages: 10,
 * //   hasNextPage: true,
 * //   hasPrevPage: true,
 * //   nextPage: 3,
 * //   prevPage: 1
 * // }
 */
const createPagination = (page, limit, total) => {
  const totalPages = getTotalPages(total, limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total: parseInt(total, 10),
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

// ============================================
// VALIDACIÓN DE PARÁMETROS
// ============================================

/**
 * Validar y normalizar parámetros de paginación
 * Asegura que page y limit sean válidos
 * 
 * @param {number|string} page - Página solicitada
 * @param {number|string} limit - Límite solicitado
 * @returns {Object} Parámetros validados { page, limit }
 * 
 * @example
 * const params = validatePaginationParams('2', '20');
 * // { page: 2, limit: 20 }
 * 
 * const params = validatePaginationParams('abc', '1000');
 * // { page: 1, limit: 100 } // Valores por defecto/máximo
 */
const validatePaginationParams = (page, limit) => {
  // Convertir a números
  let validatedPage = parseInt(page, 10);
  let validatedLimit = parseInt(limit, 10);
  
  // Validar page
  if (isNaN(validatedPage) || validatedPage < 1) {
    validatedPage = DEFAULT_PAGE;
  }
  
  // Validar limit
  if (isNaN(validatedLimit) || validatedLimit < 1) {
    validatedLimit = DEFAULT_LIMIT;
  }
  
  // No permitir límites mayores al máximo
  if (validatedLimit > MAX_LIMIT) {
    validatedLimit = MAX_LIMIT;
  }
  
  return {
    page: validatedPage,
    limit: validatedLimit
  };
};

/**
 * Extraer parámetros de paginación del request
 * Lee page y limit de req.query y los valida
 * 
 * @param {Request} req - Request de Express
 * @returns {Object} Parámetros validados { page, limit, offset }
 * 
 * @example
 * // GET /productos?page=2&limit=20
 * const params = extractPaginationParams(req);
 * // { page: 2, limit: 20, offset: 20 }
 */
const extractPaginationParams = (req) => {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;
  
  const validated = validatePaginationParams(page, limit);
  
  return {
    ...validated,
    offset: getOffset(validated.page, validated.limit)
  };
};

// ============================================
// HELPERS PARA QUERIES SQL
// ============================================

/**
 * Añadir cláusulas LIMIT y OFFSET a una query SQL
 * 
 * @param {string} query - Query SQL base
 * @param {number} limit - Límite de resultados
 * @param {number} offset - Offset de resultados
 * @returns {string} Query con LIMIT y OFFSET
 * 
 * @example
 * const baseQuery = 'SELECT * FROM productos WHERE categoria = $1';
 * const paginatedQuery = addPaginationToQuery(baseQuery, 10, 0);
 * // 'SELECT * FROM productos WHERE categoria = $1 LIMIT 10 OFFSET 0'
 */
const addPaginationToQuery = (query, limit, offset) => {
  return `${query} LIMIT ${limit} OFFSET ${offset}`;
};

/**
 * Crear query de conteo para obtener total de registros
 * Convierte una query SELECT en un COUNT(*)
 * 
 * @param {string} query - Query SELECT original
 * @returns {string} Query de conteo
 * 
 * @example
 * const selectQuery = 'SELECT * FROM productos WHERE categoria = $1';
 * const countQuery = createCountQuery(selectQuery);
 * // 'SELECT COUNT(*) as total FROM productos WHERE categoria = $1'
 */
const createCountQuery = (query) => {
  // Remover SELECT ... FROM y reemplazar con SELECT COUNT(*)
  // Buscar el primer FROM (case-insensitive)
  const fromIndex = query.toLowerCase().indexOf('from');
  
  if (fromIndex === -1) {
    throw new Error('Query inválida: no contiene FROM');
  }
  
  const fromClause = query.substring(fromIndex);
  
  // Remover ORDER BY si existe (no es necesario para COUNT)
  const orderByIndex = fromClause.toLowerCase().indexOf('order by');
  const cleanFromClause = orderByIndex > -1 
    ? fromClause.substring(0, orderByIndex)
    : fromClause;
  
  return `SELECT COUNT(*) as total ${cleanFromClause}`;
};

// ============================================
// PROCESAMIENTO DE RESULTADOS
// ============================================

/**
 * Procesar resultados de queries paginadas
 * Combina los datos con la información de paginación
 * 
 * @param {Array} data - Datos de la query paginada
 * @param {number} total - Total de registros (del COUNT)
 * @param {number} page - Página actual
 * @param {number} limit - Límite de resultados
 * @returns {Object} { data, pagination }
 * 
 * @example
 * const productos = await db.query('SELECT * FROM productos LIMIT 10 OFFSET 0');
 * const total = await db.query('SELECT COUNT(*) FROM productos');
 * 
 * const result = processPaginatedResults(
 *   productos,
 *   total[0].total,
 *   1,
 *   10
 * );
 * // {
 * //   data: [...productos],
 * //   pagination: { page: 1, limit: 10, total: 100, ... }
 * // }
 */
const processPaginatedResults = (data, total, page, limit) => {
  return {
    data,
    pagination: createPagination(page, limit, total)
  };
};

// ============================================
// HELPER COMPLETO PARA REPOSITORIOS
// ============================================

/**
 * Helper todo-en-uno para paginación en repositorios
 * Ejecuta query de datos y de conteo, retorna resultados procesados
 * 
 * @param {Function} queryFn - Función que ejecuta la query (recibe limit, offset)
 * @param {Function} countFn - Función que ejecuta el conteo
 * @param {Object} params - Parámetros { page, limit }
 * @returns {Promise<Object>} { data, pagination }
 * 
 * @example
 * // En un repository
 * async findAll(page, limit) {
 *   return paginate(
 *     // Query de datos
 *     (limit, offset) => db.query(
 *       'SELECT * FROM productos LIMIT $1 OFFSET $2',
 *       [limit, offset]
 *     ),
 *     // Query de conteo
 *     () => db.query('SELECT COUNT(*) as total FROM productos'),
 *     { page, limit }
 *   );
 * }
 */
const paginate = async (queryFn, countFn, params) => {
  const { page, limit } = validatePaginationParams(params.page, params.limit);
  const offset = getOffset(page, limit);
  
  // Ejecutar ambas queries en paralelo
  const [data, countResult] = await Promise.all([
    queryFn(limit, offset),
    countFn()
  ]);
  
  const total = countResult[0]?.total || countResult[0]?.count || 0;
  
  return processPaginatedResults(data, total, page, limit);
};

// ============================================
// HELPERS PARA LINKS DE NAVEGACIÓN
// ============================================

/**
 * Generar links de navegación para paginación
 * Útil para APIs REST HATEOAS
 * 
 * @param {string} baseUrl - URL base del recurso
 * @param {number} page - Página actual
 * @param {number} limit - Límite
 * @param {number} totalPages - Total de páginas
 * @returns {Object} Links de navegación
 * 
 * @example
 * const links = generatePaginationLinks(
 *   '/api/productos',
 *   2,
 *   10,
 *   10
 * );
 * // {
 * //   first: '/api/productos?page=1&limit=10',
 * //   prev: '/api/productos?page=1&limit=10',
 * //   self: '/api/productos?page=2&limit=10',
 * //   next: '/api/productos?page=3&limit=10',
 * //   last: '/api/productos?page=10&limit=10'
 * // }
 */
const generatePaginationLinks = (baseUrl, page, limit, totalPages) => {
  const links = {
    self: `${baseUrl}?page=${page}&limit=${limit}`
  };
  
  // First page
  links.first = `${baseUrl}?page=1&limit=${limit}`;
  
  // Last page
  links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
  
  // Previous page
  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }
  
  // Next page
  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }
  
  return links;
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  // Constantes
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  
  // Cálculos básicos
  getOffset,
  getTotalPages,
  createPagination,
  
  // Validación
  validatePaginationParams,
  extractPaginationParams,
  
  // Helpers para SQL
  addPaginationToQuery,
  createCountQuery,
  
  // Procesamiento
  processPaginatedResults,
  paginate,
  
  // Links
  generatePaginationLinks
};