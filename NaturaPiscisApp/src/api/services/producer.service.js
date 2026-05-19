// src/api/services/producer.service.js
// Servicio para datos del productor

import api from '../axios.config';

export const producerService = {
  // ============================================
  // OBTENER PERFIL DEL PRODUCTOR
  // ============================================
  getProfile: async () => {
    try {
      const response = await api.get('/productor/perfil');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      console.log('Error obteniendo perfil:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // ACTUALIZAR PERFIL
  // ============================================
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/productor/perfil', profileData);
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER ESTADÍSTICAS GENERALES
  // ============================================
  getStats: async () => {
    try {
      const response = await api.get('/estadisticas/productor');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER DASHBOARD DATA
  // Combina estadísticas + pedidos recibidos recientes
  // ============================================
  getDashboardData: async () => {
    try {
      const [statsRes, pedidosRes] = await Promise.all([
        api.get('/estadisticas/productor').catch(() => ({ data: {} })),
        api.get('/pedidos/recibidos').catch(() => ({ data: { data: [] } })),
      ]);
      return {
        success: true,
        data: {
          stats: statsRes.data.data || statsRes.data,
          pedidos: pedidosRes.data.data || [],
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER MIS PRODUCTOS
  // ============================================
  getProducts: async () => {
    try {
      const response = await api.get('/productos/productor/mis-productos');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // CREAR PRODUCTO
  // ============================================
  createProduct: async (productData) => {
    try {
      const response = await api.post('/productos', productData);
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================
  updateProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/productos/${productId}`, productData);
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // ============================================
  // ELIMINAR PRODUCTO
  // ============================================
  deleteProduct: async (productId) => {
    try {
      await api.delete(`/productos/${productId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER NOTIFICACIONES
  // ============================================
  getNotifications: async () => {
    try {
      const response = await api.get('/notificaciones');
      const data = response.data.data || response.data;
      const notifs = data?.notificaciones ?? (Array.isArray(data) ? data : []);
      return { success: true, data: notifs, noLeidas: data?.noLeidas ?? 0 };
    } catch (error) {
      return { success: true, data: [], noLeidas: 0 };
    }
  },

  // ============================================
  // MARCAR NOTIFICACIÓN COMO LEÍDA
  // ============================================
  markNotificationAsRead: async (notificationId) => {
    try {
      await api.patch(`/notificaciones/${notificationId}/leer`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // MARCAR TODAS LAS NOTIFICACIONES COMO LEÍDAS
  // ============================================
  markAllNotificationsAsRead: async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // OBTENER RESEÑAS DE UN PRODUCTOR
  // ============================================
  getOpiniones: async (productorId) => {
    try {
      const response = await api.get(`/opiniones/productor/${productorId}`);
      const data = response.data.data || response.data;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      return { success: true, data: [] };
    }
  },

  // ============================================
  // OBTENER VENTAS
  // ============================================
  getSales: async (params = {}) => {
    try {
      const response = await api.get('/estadisticas/ventas', { params });
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default producerService;
