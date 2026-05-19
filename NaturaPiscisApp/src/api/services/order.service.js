// src/api/services/order.service.js
// Servicio para gestión de pedidos

import api from '../axios.config';

export const orderService = {
  // ============================================
  // OBTENER PEDIDOS RECIBIDOS (del productor)
  // ============================================
  getRecibidos: async () => {
    try {
      const response = await api.get('/pedidos/recibidos');
      const data = response.data.data || response.data;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.log('Error obteniendo pedidos:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // ============================================
  // CAMBIAR ESTADO DE PEDIDO
  // ============================================
  cambiarEstado: async (pedidoId, nuevoEstado) => {
    try {
      const response = await api.put(`/pedidos/${pedidoId}/estado`, {
        nuevoEstado,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.log('Error cambiando estado:', error);
      throw error;
    }
  },

  // ============================================
  // OBTENER DETALLE DE UN PEDIDO
  // ============================================
  getById: async (pedidoId) => {
    try {
      const response = await api.get(`/pedidos/${pedidoId}`);
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // CONFIRMAR PEDIDO
  // ============================================
  confirmar: async (pedidoId) => {
    return orderService.cambiarEstado(pedidoId, 'confirmado');
  },

  // ============================================
  // MARCAR COMO PREPARANDO
  // ============================================
  marcarPreparando: async (pedidoId) => {
    return orderService.cambiarEstado(pedidoId, 'preparando');
  },

  // ============================================
  // MARCAR COMO LISTO PARA RECOGER
  // ============================================
  marcarListoParaRecoger: async (pedidoId) => {
    return orderService.cambiarEstado(pedidoId, 'listo_para_recoger');
  },

  // ============================================
  // MARCAR COMO EN CAMINO
  // ============================================
  marcarEnCamino: async (pedidoId) => {
    return orderService.cambiarEstado(pedidoId, 'en_camino');
  },

  // ============================================
  // MARCAR COMO ENTREGADO
  // ============================================
  marcarEntregado: async (pedidoId) => {
    return orderService.cambiarEstado(pedidoId, 'entregado');
  },

  // ============================================
  // CANCELAR PEDIDO
  // ============================================
  cancelar: async (pedidoId) => {
    return orderService.cambiarEstado(pedidoId, 'cancelado');
  },

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  getEstadisticas: async () => {
    try {
      const response = await api.get('/pedidos/estadisticas');
      const data = response.data.data || response.data;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default orderService;