// ============================================
// Application Constants
// Constantes centralizadas del proyecto
// ============================================

// ============================================
// USER ROLES
// ============================================

export const USER_ROLES = {
  ADMIN: 1,
  PRODUCER: 2,
  CONSUMER: 3,
  DRIVER: 4,
};

export const ROLE_NAMES = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.PRODUCER]: 'Productor',
  [USER_ROLES.CONSUMER]: 'Consumidor',
};

// ============================================
// ORDER STATUS
// ============================================

export const ORDER_STATUS = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmado',
  PREPARING: 'en_preparacion',
  SHIPPED: 'enviado',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.CONFIRMED]: 'Confirmado',
  [ORDER_STATUS.PREPARING]: 'En Preparación',
  [ORDER_STATUS.SHIPPED]: 'Enviado',
  [ORDER_STATUS.DELIVERED]: 'Entregado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    badge: 'yellow',
  },
  [ORDER_STATUS.CONFIRMED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    badge: 'blue',
  },
  [ORDER_STATUS.PREPARING]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    badge: 'purple',
  },
  [ORDER_STATUS.SHIPPED]: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    badge: 'indigo',
  },
  [ORDER_STATUS.DELIVERED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'green',
  },
  [ORDER_STATUS.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    badge: 'red',
  },
};

// ============================================
// PAYMENT METHODS
// ============================================

export const PAYMENT_METHODS = {
  CASH: 'efectivo',
  CARD: 'tarjeta',
  TRANSFER: 'transferencia',
  QR: 'qr',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Efectivo',
  [PAYMENT_METHODS.CARD]: 'Tarjeta de Crédito/Débito',
  [PAYMENT_METHODS.TRANSFER]: 'Transferencia Bancaria',
  [PAYMENT_METHODS.QR]: 'QR (Tigo Money / Simple)',
};

// ============================================
// SHIPPING METHODS
// ============================================

export const SHIPPING_METHODS = {
  STANDARD: 'estandar',
  EXPRESS: 'express',
  PICKUP: 'recoger',
};

export const SHIPPING_METHOD_LABELS = {
  [SHIPPING_METHODS.STANDARD]: 'Envío Estándar (2-3 días)',
  [SHIPPING_METHODS.EXPRESS]: 'Envío Express (24 horas)',
  [SHIPPING_METHODS.PICKUP]: 'Recoger en Tienda',
};

export const SHIPPING_COSTS = {
  [SHIPPING_METHODS.STANDARD]: 10,
  [SHIPPING_METHODS.EXPRESS]: 25,
  [SHIPPING_METHODS.PICKUP]: 0,
};

// ============================================
// PRODUCT CATEGORIES
// ============================================

export const PRODUCT_CATEGORIES = {
  FISH: 'pescado',
  SEAFOOD: 'mariscos',
  CRUSTACEAN: 'crustaceos',
  MOLLUSK: 'moluscos',
  ALGAE: 'algas',
  PROCESSED: 'procesados',
  OTHER: 'otros',
};

export const CATEGORY_LABELS = {
  [PRODUCT_CATEGORIES.FISH]: 'Pescados',
  [PRODUCT_CATEGORIES.SEAFOOD]: 'Mariscos',
  [PRODUCT_CATEGORIES.CRUSTACEAN]: 'Crustáceos',
  [PRODUCT_CATEGORIES.MOLLUSK]: 'Moluscos',
  [PRODUCT_CATEGORIES.ALGAE]: 'Algas',
  [PRODUCT_CATEGORIES.PROCESSED]: 'Procesados',
  [PRODUCT_CATEGORIES.OTHER]: 'Otros',
};

export const CATEGORY_ICONS = {
  [PRODUCT_CATEGORIES.FISH]: '🐟',
  [PRODUCT_CATEGORIES.SEAFOOD]: '🦐',
  [PRODUCT_CATEGORIES.CRUSTACEAN]: '🦀',
  [PRODUCT_CATEGORIES.MOLLUSK]: '🐚',
  [PRODUCT_CATEGORIES.ALGAE]: '🌿',
  [PRODUCT_CATEGORIES.PROCESSED]: '📦',
  [PRODUCT_CATEGORIES.OTHER]: '🐠',
};

// ============================================
// PRODUCT UNITS
// ============================================

export const UNITS = {
  KG: 'kg',
  LB: 'lb',
  UNIT: 'unidad',
  DOZEN: 'docena',
  PACK: 'paquete',
};

export const UNIT_LABELS = {
  [UNITS.KG]: 'Kilogramo',
  [UNITS.LB]: 'Libra',
  [UNITS.UNIT]: 'Unidad',
  [UNITS.DOZEN]: 'Docena',
  [UNITS.PACK]: 'Paquete',
};

// ============================================
// SENSOR TYPES
// ============================================

export const SENSOR_TYPES = {
  TEMPERATURE: 'temperatura',
  PH: 'ph',
  OXYGEN: 'oxigeno',
  TURBIDITY: 'turbidez',
};

export const SENSOR_LABELS = {
  [SENSOR_TYPES.TEMPERATURE]: 'Temperatura',
  [SENSOR_TYPES.PH]: 'pH',
  [SENSOR_TYPES.OXYGEN]: 'Oxígeno Disuelto',
  [SENSOR_TYPES.TURBIDITY]: 'Turbidez',
};

export const SENSOR_UNITS = {
  [SENSOR_TYPES.TEMPERATURE]: '°C',
  [SENSOR_TYPES.PH]: '',
  [SENSOR_TYPES.OXYGEN]: 'mg/L',
  [SENSOR_TYPES.TURBIDITY]: 'NTU',
};

export const SENSOR_RANGES = {
  [SENSOR_TYPES.TEMPERATURE]: { min: 18, max: 28 },
  [SENSOR_TYPES.PH]: { min: 6.5, max: 8.5 },
  [SENSOR_TYPES.OXYGEN]: { min: 5, max: 12 },
  [SENSOR_TYPES.TURBIDITY]: { min: 0, max: 50 },
};

export const SENSOR_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'offline',
};

export const SENSOR_STATUS_COLORS = {
  [SENSOR_STATUS.NORMAL]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: 'text-green-500',
  },
  [SENSOR_STATUS.WARNING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
  },
  [SENSOR_STATUS.CRITICAL]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
  [SENSOR_STATUS.OFFLINE]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: 'text-gray-500',
  },
};

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMITS: [12, 24, 48, 96],
};

// ============================================
// FILE UPLOAD
// ============================================

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENTS: ['application/pdf', 'application/msword'],
};

// ============================================
// VALIDATION
// ============================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
  PHONE_LENGTH: 8, // Bolivia
};

// ============================================
// NOTIFICATION
// ============================================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const NOTIFICATION_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
};

// ============================================
// CART
// ============================================

export const CART = {
  FREE_SHIPPING_THRESHOLD: 100, // Bs
  MAX_QUANTITY_PER_ITEM: 99,
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días
};

// ============================================
// SEARCH
// ============================================

export const SEARCH = {
  MIN_SEARCH_LENGTH: 3,
  DEBOUNCE_DELAY: 300, // ms
  MAX_RESULTS: 20,
};

// ============================================
// THEME
// ============================================

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión. Verifica tu internet.',
  SERVER: 'Error del servidor. Intenta más tarde.',
  UNAUTHORIZED: 'No autorizado. Inicia sesión nuevamente.',
  FORBIDDEN: 'No tienes permisos para esta acción.',
  NOT_FOUND: 'Recurso no encontrado.',
  VALIDATION: 'Datos inválidos. Verifica los campos.',
  UNKNOWN: 'Error desconocido. Intenta nuevamente.',
};

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN: 'Inicio de sesión exitoso',
  REGISTER: 'Registro exitoso',
  LOGOUT: 'Sesión cerrada exitosamente',
  SAVE: 'Guardado exitosamente',
  UPDATE: 'Actualizado exitosamente',
  DELETE: 'Eliminado exitosamente',
  ADDED_TO_CART: 'Producto agregado al carrito',
  ORDER_CREATED: 'Pedido creado exitosamente',
};

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'usuario',
  THEME: 'theme',
  CART_SESSION: 'cart_session_id',
  FAVORITES: 'favorites',
  RECENT_SEARCHES: 'recent_searches',
};

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/registro',
  LOGOUT: '/auth/logout',
  VERIFY: '/auth/verificar',
  
  // Products
  PRODUCTS: '/productos',
  PRODUCTS_SEARCH: '/productos/buscar',
  PRODUCTS_FEATURED: '/productos/destacados',
  
  // Cart
  CART: '/carrito',
  CART_ADD: '/carrito/agregar',
  CART_MIGRATE: '/carrito/migrar',
  
  // Orders
  ORDERS: '/pedidos',
  ORDERS_CREATE: '/pedidos/crear',
  ORDERS_STATUS: '/pedidos/estado',
  
  // Producers
  PRODUCERS: '/productores',
  
  // Sensors
  SENSORS: '/sensores',
};

// ============================================
// ROUTES
// ============================================

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/registro',
  
  // Consumer
  CONSUMER_DASHBOARD: '/dashboard-consumidor',
  CONSUMER_HOME: '/dashboard-consumidor',
  CONSUMER_PRODUCERS: '/dashboard-consumidor/productores',
  CONSUMER_CART: '/dashboard-consumidor/carrito',
  CONSUMER_ORDERS: '/dashboard-consumidor/mis-pedidos',
  CONSUMER_FAVORITES: '/dashboard-consumidor/favoritos',
  CONSUMER_PROFILE: '/dashboard-consumidor/perfil',
  
  // Producer
  PRODUCER_DASHBOARD: '/dashboard-productor',
  PRODUCER_MONITORING: '/dashboard-productor',
  PRODUCER_ORDERS: '/dashboard-productor/pedidos',
  PRODUCER_INVENTORY: '/dashboard-productor/inventario',
  PRODUCER_STATS: '/dashboard-productor/estadisticas',
  PRODUCER_PROFILE: '/dashboard-productor/perfil',
};

// ============================================
// TIME INTERVALS
// ============================================

export const INTERVALS = {
  SENSOR_REFRESH: 5000, // 5 segundos
  CART_SYNC: 30000, // 30 segundos
  ORDER_POLLING: 60000, // 1 minuto
  NOTIFICATION_CHECK: 120000, // 2 minutos
};

// ============================================
// REGEX PATTERNS
// ============================================

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_BO: /^[67]\d{7}$/, // Teléfono boliviano
  NIT_BO: /^\d{7,10}$/, // NIT boliviano
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
};

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULTS = {
  PRODUCT_IMAGE: '/images/default-product.jpg',
  USER_AVATAR: '/images/default-avatar.jpg',
  PRODUCER_IMAGE: '/images/default-producer.jpg',
  CURRENCY: 'BOB',
  LANGUAGE: 'es-ES',
  TIMEZONE: 'America/La_Paz',
};

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  ENABLE_CART: true,
  ENABLE_FAVORITES: true,
  ENABLE_REVIEWS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_SENSORS: true,
  ENABLE_CHAT: false, // Futuro
  ENABLE_ANALYTICS: false, // Futuro
};