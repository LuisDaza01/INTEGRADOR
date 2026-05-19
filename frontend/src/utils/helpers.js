// ============================================
// Utility Helpers
// Funciones auxiliares reutilizables
// ============================================

// ============================================
// DATE & TIME HELPERS
// ============================================

/**
 * Formatear fecha a formato local
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Date(date).toLocaleDateString('es-ES', defaultOptions);
};

/**
 * Formatear fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateada
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Obtener tiempo relativo (hace X tiempo)
 * @param {string|Date} date - Fecha
 * @returns {string} - Tiempo relativo
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return formatDate(date);
};

// ============================================
// NUMBER & CURRENCY HELPERS
// ============================================

/**
 * Formatear precio en bolivianos
 * @param {number} amount - Cantidad
 * @returns {string} - Precio formateado
 */
export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return 'Bs 0.00';
  
  return `Bs ${Number(amount).toFixed(2)}`;
};

/**
 * Formatear número con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  
  return Number(number).toLocaleString('es-ES');
};

/**
 * Formatear porcentaje
 * @param {number} value - Valor (0-100 o 0-1)
 * @param {boolean} isDecimal - Si el valor está en decimal (0-1)
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (value, isDecimal = false) => {
  if (value === null || value === undefined) return '0%';
  
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
};

// ============================================
// STRING HELPERS
// ============================================

/**
 * Capitalizar primera letra
 * @param {string} str - String a capitalizar
 * @returns {string} - String capitalizado
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncar texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Generar slug de texto
 * @param {string} text - Texto
 * @returns {string} - Slug
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} - Es válido
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar teléfono boliviano
 * @param {string} phone - Teléfono
 * @returns {boolean} - Es válido
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Teléfono boliviano: 8 dígitos
  const phoneRegex = /^[67]\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validar NIT boliviano
 * @param {string} nit - NIT
 * @returns {boolean} - Es válido
 */
export const isValidNIT = (nit) => {
  if (!nit) return false;
  
  // NIT boliviano básico
  const nitRegex = /^\d{7,10}$/;
  return nitRegex.test(nit.replace(/\s/g, ''));
};

// ============================================
// ARRAY HELPERS
// ============================================

/**
 * Agrupar array por propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Propiedad para agrupar
 * @returns {Object} - Objeto agrupado
 */
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Obtener elementos únicos de array
 * @param {Array} array - Array
 * @param {string} key - Propiedad única (opcional)
 * @returns {Array} - Array sin duplicados
 */
export const unique = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Ordenar array por propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Propiedad
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array} - Array ordenado
 */
export const sortBy = (array, key, order = 'asc') => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// ============================================
// OBJECT HELPERS
// ============================================

/**
 * Verificar si objeto está vacío
 * @param {Object} obj - Objeto
 * @returns {boolean} - Está vacío
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj !== 'object') return false;
  
  return Object.keys(obj).length === 0;
};

/**
 * Clonar objeto profundamente
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} - Objeto clonado
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Limpiar objeto (eliminar valores null/undefined)
 * @param {Object} obj - Objeto
 * @returns {Object} - Objeto limpio
 */
export const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

// ============================================
// FILE HELPERS
// ============================================

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Obtener extensión de archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Extensión
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

// ============================================
// ASYNC HELPERS
// ============================================

/**
 * Delay (espera)
 * @param {number} ms - Milisegundos
 * @returns {Promise} - Promesa que resuelve después del delay
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry función con reintentos
 * @param {Function} fn - Función a ejecutar
 * @param {number} retries - Número de reintentos
 * @param {number} delayMs - Delay entre reintentos
 * @returns {Promise} - Resultado de la función
 */
export const retry = async (fn, retries = 3, delayMs = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs);
  }
};

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

/**
 * Guardar en localStorage con JSON
 * @param {string} key - Clave
 * @param {any} value - Valor
 */
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error guardando en localStorage:', error);
  }
};

/**
 * Obtener de localStorage con JSON
 * @param {string} key - Clave
 * @param {any} defaultValue - Valor por defecto
 * @returns {any} - Valor
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error leyendo de localStorage:', error);
    return defaultValue;
  }
};

/**
 * Eliminar de localStorage
 * @param {string} key - Clave
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error eliminando de localStorage:', error);
  }
};

// ============================================
// RANDOM HELPERS
// ============================================

/**
 * Generar ID único
 * @returns {string} - ID único
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generar color aleatorio
 * @returns {string} - Color hex
 */
export const randomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce función
 * @param {Function} func - Función
 * @param {number} wait - Tiempo de espera (ms)
 * @returns {Function} - Función con debounce
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle función
 * @param {Function} func - Función
 * @param {number} limit - Límite de tiempo (ms)
 * @returns {Function} - Función con throttle
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};