// src/api/services/product.service.js
import api from '../axios.config';
import * as SecureStore from 'expo-secure-store';

export const productService = {
  // Obtener productos del productor
  async getMisProductos() {
    try {
      // Obtener user del storage
      const userData = await SecureStore.getItemAsync('userData');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user?.id) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      const response = await api.get(`/productos?productor_id=${user.id}`);
      const productos = response.data.data || response.data;
      return { success: true, data: productos };
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      return { success: false, error: error.response?.data?.error || 'Error al obtener productos' };
    }
  },

  // Crear producto (soporta JSON y FormData con imagen)
  async crearProducto(productoData, isFormData = false) {
    try {
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const response = await api.post('/productos', productoData, config);
      const producto = response.data.data || response.data.producto || response.data;
      return { success: true, data: producto };
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      return { success: false, error: error.response?.data?.error || 'Error al crear producto' };
    }
  },

  // Actualizar producto (soporta JSON y FormData con imagen)
  async actualizarProducto(id, productoData, isFormData = false) {
    try {
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const response = await api.put(`/productos/${id}`, productoData, config);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      return { success: false, error: error.response?.data?.error || 'Error al actualizar producto' };
    }
  },

  // Eliminar producto
  // Eliminar producto
  async eliminarProducto(id) {
    try {
      const response = await api.delete(`/productos/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || 'Error al eliminar producto';
      
      // Si es error 400, tiene pedidos activos
      if (error.response?.status === 400) {
        return {
          success: false,
          error: errorMessage,
          code: 'PEDIDOS_ACTIVOS',
        };
      }
      
      return { success: false, error: errorMessage };
    }
  },
};

export default productService;