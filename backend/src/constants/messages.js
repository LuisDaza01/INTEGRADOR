// ============================================
// src/constants/messages.js - MENSAJES DEL SISTEMA
// ============================================
// Este archivo centraliza todos los mensajes que se muestran al usuario
// Facilita la internacionalización (i18n) en el futuro
// Evita duplicar mensajes y typos

/**
 * Mensajes de éxito
 * Se usan cuando una operación se completa correctamente
 */
const SUCCESS_MESSAGES = {
  // Operaciones CRUD generales
  CREATED: 'Creado exitosamente',
  UPDATED: 'Actualizado exitosamente',
  DELETED: 'Eliminado exitosamente',
  FETCHED: 'Datos obtenidos exitosamente',
  SAVED: 'Guardado exitosamente',
  
  // Autenticación
  LOGIN: 'Inicio de sesión exitoso',
  LOGOUT: 'Sesión cerrada correctamente',
  REGISTER: 'Usuario registrado correctamente',
  PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
  PASSWORD_RESET: 'Contraseña restablecida exitosamente',
  PASSWORD_RESET_EMAIL_SENT: 'Email de recuperación enviado',
  EMAIL_VERIFIED: 'Email verificado exitosamente',
  TOKEN_REFRESHED: 'Token actualizado correctamente',
  
  // Productos
  PRODUCT_CREATED: 'Producto creado exitosamente',
  PRODUCT_UPDATED: 'Producto actualizado exitosamente',
  PRODUCT_DELETED: 'Producto eliminado exitosamente',
  PRODUCT_ACTIVATED: 'Producto activado exitosamente',
  PRODUCT_DEACTIVATED: 'Producto desactivado exitosamente',
  
  // Pedidos
  ORDER_CREATED: 'Pedido creado exitosamente',
  ORDER_UPDATED: 'Pedido actualizado exitosamente',
  ORDER_CANCELLED: 'Pedido cancelado exitosamente',
  ORDER_CONFIRMED: 'Pedido confirmado exitosamente',
  ORDER_STATUS_UPDATED: 'Estado del pedido actualizado',
  ORDER_DELIVERED: 'Pedido marcado como entregado',
  
  // Carrito
  ITEM_ADDED_TO_CART: 'Producto agregado al carrito',
  ITEM_REMOVED_FROM_CART: 'Producto removido del carrito',
  ITEM_UPDATED_IN_CART: 'Cantidad actualizada en el carrito',
  CART_UPDATED: 'Carrito actualizado',
  CART_CLEARED: 'Carrito vaciado',
  
  // Perfil de usuario
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  AVATAR_UPDATED: 'Foto de perfil actualizada',
  ADDRESS_ADDED: 'Dirección agregada',
  ADDRESS_UPDATED: 'Dirección actualizada',
  ADDRESS_DELETED: 'Dirección eliminada',
  
  // Sensores IoT
  SENSOR_CREATED: 'Sensor registrado exitosamente',
  SENSOR_UPDATED: 'Sensor actualizado',
  SENSOR_DELETED: 'Sensor eliminado',
  SENSOR_DATA_SAVED: 'Datos de sensor guardados',
  ALERT_CREATED: 'Alerta generada',
  ALERT_RESOLVED: 'Alerta resuelta',
  ALERT_DISMISSED: 'Alerta descartada',
  
  // Estanques
  POND_CREATED: 'Estanque creado exitosamente',
  POND_UPDATED: 'Estanque actualizado',
  POND_DELETED: 'Estanque eliminado',
  
  // Valoraciones
  REVIEW_CREATED: 'Valoración publicada',
  REVIEW_UPDATED: 'Valoración actualizada',
  REVIEW_DELETED: 'Valoración eliminada',
  
  // Notificaciones
  NOTIFICATION_READ: 'Notificación marcada como leída',
  NOTIFICATIONS_READ: 'Notificaciones marcadas como leídas',
  NOTIFICATION_DELETED: 'Notificación eliminada',
  
  // Upload de archivos
  FILE_UPLOADED: 'Archivo subido exitosamente',
  FILES_UPLOADED: 'Archivos subidos exitosamente',
  IMAGE_UPLOADED: 'Imagen subida exitosamente'
};

/**
 * Mensajes de error
 * Se usan cuando algo sale mal
 */
const ERROR_MESSAGES = {
  // Errores generales del sistema
  INTERNAL_ERROR: 'Error interno del servidor. Por favor intenta de nuevo más tarde',
  NOT_FOUND: 'Recurso no encontrado',
  VALIDATION_ERROR: 'Error de validación en los datos enviados',
  UNAUTHORIZED: 'No autorizado. Por favor inicia sesión',
  FORBIDDEN: 'No tienes permisos para realizar esta acción',
  CONFLICT: 'El recurso ya existe',
  BAD_REQUEST: 'Petición incorrecta. Verifica los datos enviados',
  TOO_MANY_REQUESTS: 'Demasiadas peticiones. Por favor intenta más tarde',
  SERVICE_UNAVAILABLE: 'Servicio no disponible temporalmente',
  
  // Autenticación
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  TOKEN_EXPIRED: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo',
  TOKEN_INVALID: 'Token inválido o manipulado',
  TOKEN_REQUIRED: 'Se requiere token de autenticación',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor inicia sesión',
  EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
  EMAIL_NOT_FOUND: 'No existe una cuenta con ese email',
  USER_NOT_FOUND: 'Usuario no encontrado',
  USER_INACTIVE: 'Usuario inactivo. Contacta al administrador',
  USER_SUSPENDED: 'Usuario suspendido. Contacta al administrador',
  INCORRECT_PASSWORD: 'Contraseña incorrecta',
  WEAK_PASSWORD: 'La contraseña es muy débil',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  
  // Productos
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  INSUFFICIENT_STOCK: 'Stock insuficiente para completar la operación',
  PRODUCT_UNAVAILABLE: 'Producto no disponible actualmente',
  INVALID_PRODUCT_DATA: 'Datos de producto inválidos',
  PRODUCT_ALREADY_EXISTS: 'Ya existe un producto con ese nombre',
  CANNOT_DELETE_PRODUCT: 'No se puede eliminar el producto',
  
  // Pedidos
  ORDER_NOT_FOUND: 'Pedido no encontrado',
  INVALID_ORDER_STATUS: 'Estado de pedido inválido',
  CANNOT_CANCEL_ORDER: 'No se puede cancelar el pedido en su estado actual',
  ORDER_ALREADY_CANCELLED: 'El pedido ya está cancelado',
  ORDER_ALREADY_DELIVERED: 'El pedido ya fue entregado',
  EMPTY_ORDER: 'El pedido está vacío',
  INVALID_ORDER_TRANSITION: 'Transición de estado no permitida',
  
  // Carrito
  CART_EMPTY: 'El carrito está vacío',
  ITEM_NOT_IN_CART: 'El producto no está en el carrito',
  INVALID_QUANTITY: 'Cantidad inválida',
  CART_LIMIT_EXCEEDED: 'Has excedido el límite de productos en el carrito',
  
  // Permisos y autorización
  INSUFFICIENT_PERMISSIONS: 'No tienes permisos suficientes para esta acción',
  NOT_OWNER: 'No eres el propietario de este recurso',
  ROLE_REQUIRED: 'Se requiere un rol específico para esta acción',
  ADMIN_REQUIRED: 'Solo administradores pueden realizar esta acción',
  PRODUCER_REQUIRED: 'Solo productores pueden realizar esta acción',
  
  // Upload de archivos
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo permitido: 5MB',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
  UPLOAD_FAILED: 'Error al subir el archivo',
  NO_FILE_PROVIDED: 'No se proporcionó ningún archivo',
  
  // Base de datos
  DATABASE_ERROR: 'Error de base de datos',
  DUPLICATE_ENTRY: 'Ya existe un registro con esos datos',
  FOREIGN_KEY_VIOLATION: 'No se puede eliminar porque está relacionado con otros datos',
  CONNECTION_ERROR: 'Error de conexión a la base de datos',
  
  // Validación específica
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Formato de email inválido',
  INVALID_PHONE: 'Formato de teléfono inválido',
  INVALID_URL: 'URL inválida',
  INVALID_DATE: 'Fecha inválida',
  INVALID_NUMBER: 'Número inválido',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 6 caracteres',
  PASSWORD_TOO_LONG: 'La contraseña no puede exceder 128 caracteres',
  
  // Sensores IoT
  SENSOR_NOT_FOUND: 'Sensor no encontrado',
  INVALID_SENSOR_DATA: 'Datos de sensor inválidos',
  SENSOR_OFFLINE: 'Sensor fuera de línea',
  
  // Estanques
  POND_NOT_FOUND: 'Estanque no encontrado',
  POND_HAS_SENSORS: 'No se puede eliminar el estanque porque tiene sensores asociados',
  
  // Valoraciones
  REVIEW_NOT_FOUND: 'Valoración no encontrada',
  ALREADY_REVIEWED: 'Ya has valorado este producto',
  CANNOT_REVIEW_OWN_PRODUCT: 'No puedes valorar tu propio producto',
  
  // Notificaciones
  NOTIFICATION_NOT_FOUND: 'Notificación no encontrada'
};

/**
 * Mensajes de validación
 * Se usan en validaciones con express-validator
 */
const VALIDATION_MESSAGES = {
  // Funciones que retornan mensajes personalizados
  REQUIRED: (field) => `El campo ${field} es obligatorio`,
  
  EMAIL_INVALID: 'El formato del email es inválido',
  
  PASSWORD_MIN: (min) => `La contraseña debe tener al menos ${min} caracteres`,
  PASSWORD_MAX: (max) => `La contraseña no puede exceder ${max} caracteres`,
  
  STRING_MIN: (field, min) => `${field} debe tener al menos ${min} caracteres`,
  STRING_MAX: (field, max) => `${field} no puede exceder ${max} caracteres`,
  
  NUMBER_MIN: (field, min) => `${field} debe ser mayor o igual a ${min}`,
  NUMBER_MAX: (field, max) => `${field} debe ser menor o igual a ${max}`,
  
  PHONE_INVALID: 'El formato del teléfono es inválido',
  URL_INVALID: 'El formato de la URL es inválido',
  DATE_INVALID: 'El formato de la fecha es inválido',
  
  ENUM_INVALID: (field, values) => 
    `${field} debe ser uno de los siguientes valores: ${values.join(', ')}`,
  
  ARRAY_MIN: (field, min) => 
    `${field} debe tener al menos ${min} elemento(s)`,
  ARRAY_MAX: (field, max) => 
    `${field} no puede tener más de ${max} elemento(s)`,
  
  ALPHA: (field) => `${field} solo puede contener letras`,
  ALPHANUMERIC: (field) => `${field} solo puede contener letras y números`,
  
  POSITIVE: (field) => `${field} debe ser un número positivo`,
  INTEGER: (field) => `${field} debe ser un número entero`,
  
  UNIQUE: (field) => `${field} ya está en uso`,
  EXISTS: (field) => `${field} no existe en el sistema`
};

/**
 * Mensajes informativos
 * Se usan para informar al usuario de algo
 */
const INFO_MESSAGES = {
  WELCOME: '¡Bienvenido a NaturaPiscis!',
  NO_RESULTS: 'No se encontraron resultados',
  EMPTY_LIST: 'La lista está vacía',
  PROCESSING: 'Procesando tu solicitud...',
  PLEASE_WAIT: 'Por favor espera...',
  MAINTENANCE: 'Sistema en mantenimiento. Vuelve pronto',
  COMING_SOON: 'Esta funcionalidad estará disponible próximamente',
  BETA_FEATURE: 'Esta es una funcionalidad en versión beta',
  DEPRECATED: 'Esta funcionalidad será descontinuada pronto',
  CHECK_EMAIL: 'Revisa tu email para continuar',
  VERIFICATION_SENT: 'Email de verificación enviado',
  RESET_LINK_SENT: 'Link de recuperación enviado a tu email'
};

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Obtener mensaje de validación personalizado
 * 
 * @param {string} key - Clave del mensaje
 * @param  {...any} args - Argumentos para el mensaje
 * @returns {string} Mensaje formateado
 * 
 * @example
 * getValidationMessage('REQUIRED', 'nombre');
 * // "El campo nombre es obligatorio"
 * 
 * getValidationMessage('STRING_MIN', 'descripción', 10);
 * // "descripción debe tener al menos 10 caracteres"
 */
const getValidationMessage = (key, ...args) => {
  const message = VALIDATION_MESSAGES[key];
  
  if (typeof message === 'function') {
    return message(...args);
  }
  
  return message || 'Error de validación';
};

/**
 * Crear mensaje de error con detalles
 * 
 * @param {string} baseMessage - Mensaje base
 * @param {string} details - Detalles adicionales
 * @returns {string} Mensaje completo
 * 
 * @example
 * createErrorMessage(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 'ID: 123');
 * // "Producto no encontrado. ID: 123"
 */
const createErrorMessage = (baseMessage, details = null) => {
  if (details) {
    return `${baseMessage}. ${details}`;
  }
  return baseMessage;
};

/**
 * Pluralizar mensaje según cantidad
 * 
 * @param {number} count - Cantidad
 * @param {string} singular - Mensaje en singular
 * @param {string} plural - Mensaje en plural
 * @returns {string} Mensaje apropiado
 * 
 * @example
 * pluralize(1, 'producto', 'productos'); // "producto"
 * pluralize(5, 'producto', 'productos'); // "productos"
 */
const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : plural;
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  // Mensajes
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
  INFO_MESSAGES,
  
  // Funciones helper
  getValidationMessage,
  createErrorMessage,
  pluralize
};