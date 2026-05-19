// src/api/services/carrito.service.js
// Servicio para manejar el carrito de compras

import api from '../axios.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@naturapiscis_cart';

/**
 * Obtiene el carrito del usuario desde el backend
 */
export const obtenerCarrito = async () => {
  try {
    const response = await api.get('/carrito');
    return response.data;
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    // Fallback a storage local
    const localCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return localCart ? JSON.parse(localCart) : { items: [], total: 0 };
  }
};

/**
 * Agrega un producto al carrito
 */
export const agregarAlCarrito = async (productoId, cantidad = 1) => {
  try {
    const response = await api.post('/carrito', {
      producto_id: productoId,
      cantidad,
    });
    return response.data;
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    // Fallback: guardar localmente
    await agregarAlCarritoLocal(productoId, cantidad);
    throw error;
  }
};

/**
 * Actualiza la cantidad de un item en el carrito
 */
export const actualizarCantidad = async (itemId, cantidad) => {
  try {
    const response = await api.put(`/carrito/${itemId}`, { cantidad });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    throw error;
  }
};

/**
 * Elimina un item del carrito
 */
export const eliminarDelCarrito = async (itemId) => {
  try {
    const response = await api.delete(`/carrito/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    throw error;
  }
};

/**
 * Vacía el carrito completo
 */
export const vaciarCarrito = async () => {
  try {
    const response = await api.delete('/carrito');
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    return response.data;
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    throw error;
  }
};

/**
 * Sincroniza el carrito local con el backend
 */
export const sincronizarCarrito = async () => {
  try {
    const localCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (localCart) {
      const items = JSON.parse(localCart);
      for (const item of items) {
        await api.post('/carrito', {
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        });
      }
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
    }
    return await obtenerCarrito();
  } catch (error) {
    console.error('Error al sincronizar carrito:', error);
    throw error;
  }
};

/**
 * Obtiene el número total de items en el carrito
 */
export const obtenerCantidadItems = async () => {
  try {
    const carrito = await obtenerCarrito();
    return carrito.items?.reduce((total, item) => total + item.cantidad, 0) || 0;
  } catch (error) {
    console.error('Error al obtener cantidad de items:', error);
    return 0;
  }
};

// ============================================
// FUNCIONES DE ALMACENAMIENTO LOCAL (FALLBACK)
// ============================================

const agregarAlCarritoLocal = async (productoId, cantidad) => {
  try {
    const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
    const items = cartData ? JSON.parse(cartData) : [];
    
    const existingIndex = items.findIndex(item => item.producto_id === productoId);
    
    if (existingIndex >= 0) {
      items[existingIndex].cantidad += cantidad;
    } else {
      items.push({ producto_id: productoId, cantidad });
    }
    
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    return { items };
  } catch (error) {
    console.error('Error al guardar carrito local:', error);
    throw error;
  }
};

export const obtenerCarritoLocal = async () => {
  try {
    const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error al obtener carrito local:', error);
    return [];
  }
};

export const limpiarCarritoLocal = async () => {
  try {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error al limpiar carrito local:', error);
  }
};

// Export default con todas las funciones
export default {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  vaciarCarrito,
  sincronizarCarrito,
  obtenerCantidadItems,
  obtenerCarritoLocal,
  limpiarCarritoLocal,
};