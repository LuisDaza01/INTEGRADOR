// src/config/apiConfig.js
// URLs ajustadas para coincidir con el backend actual (api-routes.js + api-auth-routes.js)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {

  // ==================== AUTENTICACIÓN ====================
  // Montadas bajo /api/auth  (api-auth-routes.js)
  AUTH: {
    LOGIN:    `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/registro`,   // ⚠️ era /register → es /registro
    LOGOUT:   `${API_BASE_URL}/auth/logout`,
    VERIFY:   `${API_BASE_URL}/auth/verificar`,  // ⚠️ era /verify  → es /verificar
  },

  // ==================== PRODUCTOS ====================
  // GET  /api/productos/destacados
  // GET  /api/productos/buscar
  // GET  /api/productos/:id
  PRODUCTOS: {
    BASE:          `${API_BASE_URL}/productos`,
    BY_ID:         (id) => `${API_BASE_URL}/productos/${id}`,
    SEARCH:        `${API_BASE_URL}/productos/buscar`,
    DESTACADOS:    `${API_BASE_URL}/productos/destacados`,
    POR_PRODUCTOR: (id) => `${API_BASE_URL}/productores/${id}/productos`,
  },

  // ==================== MIS PRODUCTOS (Productor autenticado) ====================
  // GET    /api/mis-productos
  // POST   /api/mis-productos
  // PUT    /api/mis-productos/:id
  // DELETE /api/mis-productos/:id
  MIS_PRODUCTOS: {
    BASE:  `${API_BASE_URL}/productos/productor/mis-productos`,
    CREAR: `${API_BASE_URL}/productos`,
    BY_ID: (id) => `${API_BASE_URL}/productos/${id}`,
  },

  // ==================== CARRITO ====================
  // POST   /api/carrito/agregar
  // GET    /api/carrito
  // PUT    /api/carrito/:id
  // DELETE /api/carrito/:id
  CARRITO: {
    BASE:       `${API_BASE_URL}/carrito`,
    AGREGAR:    `${API_BASE_URL}/carrito`,           // POST /api/carrito (sin /agregar)
    ACTUALIZAR: (id) => `${API_BASE_URL}/carrito/${id}`,
    ELIMINAR:   (id) => `${API_BASE_URL}/carrito/${id}`,
    LIMPIAR:    `${API_BASE_URL}/carrito/limpiar`,
    MIGRAR:     `${API_BASE_URL}/carrito/migrar`,
  },

  // ==================== PEDIDOS ====================
  // GET  /api/pedidos/recientes     → consumidor (sus pedidos)
  // POST /api/pedidos/crear         → consumidor (crear pedido)
  // GET  /api/pedidos-recibidos     → productor  (pedidos que le llegan)
  // PUT  /api/pedidos/:id/estado    → productor  (cambiar estado)
  PEDIDOS: {
    BASE:              `${API_BASE_URL}/pedidos`,
    RECIENTES:         `${API_BASE_URL}/pedidos/recientes`,
    CREAR:             `${API_BASE_URL}/pedidos`,
    RECIBIDOS:         `${API_BASE_URL}/pedidos/recibidos`,
    ESTADO:            (id) => `${API_BASE_URL}/pedidos/${id}/estado`,
    STATS_CONSUMIDOR:  `${API_BASE_URL}/pedidos/stats/consumidor`,
  },

  // ==================== PRODUCTORES ====================
  // GET /api/productores
  // GET /api/productores/:id
  // GET /api/productores/:id/productos
  // PUT /api/productores/:id
  PRODUCTORES: {
    BASE:       `${API_BASE_URL}/productores`,
    BY_ID:      (id) => `${API_BASE_URL}/productores/${id}`,
    PRODUCTOS:  (id) => `${API_BASE_URL}/productores/${id}/productos`,
    ACTUALIZAR: (id) => `${API_BASE_URL}/productores/${id}`,
  },

  // ==================== PERFIL ====================
  // GET /api/perfil              → consumidor autenticado
  // GET /api/productor/perfil    → productor autenticado
  // PUT /api/productor/perfil    → productor autenticado
  PERFIL: {
    CONSUMIDOR:           `${API_BASE_URL}/perfil`,
    PRODUCTOR:            `${API_BASE_URL}/productor/perfil`,
    ACTUALIZAR_PRODUCTOR: `${API_BASE_URL}/productor/perfil`,
  },

  // ==================== ESTADÍSTICAS ====================
  // GET /api/estadisticas-productor  → productor autenticado
  ESTADISTICAS: {
    PRODUCTOR:  `${API_BASE_URL}/estadisticas/productor`,
    VENTAS:     `${API_BASE_URL}/estadisticas/ventas`,
    PRODUCTOS:  `${API_BASE_URL}/estadisticas/productos`,
    PREDICCION: `${API_BASE_URL}/estadisticas/prediccion`,
    MARKETING:  `${API_BASE_URL}/estadisticas/marketing`,
  },

  // ==================== RESERVAS ====================
  // POST /api/reservas
  RESERVAS: {
    BASE:  `${API_BASE_URL}/reservas`,
    CREAR: `${API_BASE_URL}/reservas`,
  },

  // ==================== OPINIONES ====================
  OPINIONES: {
    POR_PRODUCTO:  (id) => `${API_BASE_URL}/opiniones/producto/${id}`,
    POR_PRODUCTOR: (id) => `${API_BASE_URL}/opiniones/productor/${id}`,
    CREAR:         `${API_BASE_URL}/opiniones`,
    RESPONDER:     (id) => `${API_BASE_URL}/opiniones/${id}/respuesta`,
  },

  // ==================== SENSORES (IoT) ====================
  // GET /api/sensores/:estanqueId
  SENSORES: {
    BY_ESTANQUE: (estanqueId) => `${API_BASE_URL}/sensores/${estanqueId}`,
  },

  // ==================== GALERÍA DEL CRIADERO ====================
  // POST   /api/productor/galeria      → subir imagen o video
  // DELETE /api/productor/galeria/:idx → eliminar por índice
  GALERIA: {
    BASE:    `${API_BASE_URL}/productor/galeria`,
    ELIMINAR: (index) => `${API_BASE_URL}/productor/galeria/${index}`,
  },

  // ==================== FOTOS DE PERFIL Y PORTADA ====================
  FOTOS: {
    PERFIL:   `${API_BASE_URL}/productor/foto-perfil`,
    PORTADA:  `${API_BASE_URL}/productor/foto-portada`,
    QR_PAGO:  `${API_BASE_URL}/productor/perfil/qr`,
  },

  // ==================== CATEGORÍAS ====================
  // GET /api/categorias
  CATEGORIAS: {
    BASE: `${API_BASE_URL}/categorias`,
  },

  // ==================== CUPONES ====================
  CUPONES: {
    VALIDAR: `${API_BASE_URL}/cupones/validar`,
    BASE:    `${API_BASE_URL}/cupones`,
    USAR:    (id) => `${API_BASE_URL}/cupones/${id}/usar`,
  },

  // ==================== NOTIFICACIONES ====================
  NOTIFICACIONES: {
    BASE:          `${API_BASE_URL}/notificaciones`,
    LEER:          (id) => `${API_BASE_URL}/notificaciones/${id}/leer`,
    LEER_TODAS:    `${API_BASE_URL}/notificaciones/leer-todas`,
  },

};

export default API_ENDPOINTS;