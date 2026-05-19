// src/api/services/mensaje.service.js
import api from '../axios.config';

export const mensajeService = {
  async getConversaciones() {
    try {
      const response = await api.get('/mensajes/conversaciones');
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Error al obtener conversaciones' };
    }
  },

  async getMensajes(destinatarioId) {
    try {
      const response = await api.get(`/mensajes/directo/${destinatarioId}`);
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Error al obtener mensajes' };
    }
  },

  async enviar(destinatarioId, contenido) {
    try {
      const response = await api.post('/mensajes', { destinatario_id: destinatarioId, contenido });
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Error al enviar mensaje' };
    }
  },

  async enviarMedia(destinatarioId, uri, mimeType) {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'archivo';
      formData.append('archivo', { uri, name: filename, type: mimeType });
      formData.append('destinatario_id', String(destinatarioId));

      const response = await api.post('/mensajes/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Error al enviar archivo' };
    }
  },
};

export default mensajeService;
