import { useState, useEffect } from 'react';
import { obtenerCarrito } from '../services/carritoService';

// 🪝 Hook personalizado para manejar el carrito
export const useCarrito = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Calcular totales
  const cantidadTotal = cartItems.reduce((sum, item) => sum + item.cantidad, 0);
  const totalCarrito = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  // Función para cargar el carrito
  const cargarCarrito = async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) setLoading(true);
      setError(null);
      
      const data = await obtenerCarrito();
      setCartItems(data?.items || []);
      setLastUpdate(new Date());
      
      console.log('🪝 useCarrito - Carrito cargado:', data?.items?.length || 0, 'productos');
    } catch (err) {
      console.error('🪝 useCarrito - Error:', err);
      
      if (err.message === 'AUTH_REQUIRED' || err.message?.includes('iniciar sesión')) {
        setCartItems([]);
        setError('no_auth');
      } else {
        setError(err.message || 'Error al cargar carrito');
      }
    } finally {
      if (mostrarLoading) setLoading(false);
    }
  };

  // Cargar carrito al montar
  useEffect(() => {
    cargarCarrito();
  }, []);

  // Escuchar eventos de actualización del carrito
  useEffect(() => {
    const handleCarritoUpdate = () => {
      console.log('🪝 useCarrito - Detectado evento carritoActualizado');
      cargarCarrito(false); // No mostrar loading en actualizaciones automáticas
    };

    const handleStorageChange = (e) => {
      if (e.key === 'carrito_updated') {
        console.log('🪝 useCarrito - Detectado cambio en localStorage');
        cargarCarrito(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🪝 useCarrito - Página visible, actualizando...');
        cargarCarrito(false);
      }
    };

    // Registrar eventos
    window.addEventListener('carritoActualizado', handleCarritoUpdate);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('carritoActualizado', handleCarritoUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-refresh cada 30 segundos (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🪝 useCarrito - Auto-refresh');
      cargarCarrito(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    // Estado
    cartItems,
    loading,
    error,
    lastUpdate,
    
    // Totales calculados
    cantidadTotal,
    totalCarrito,
    
    // Funciones
    cargarCarrito,
    refrescarCarrito: () => cargarCarrito(true),
    
    // Estados derivados
    isEmpty: cartItems.length === 0,
    hasItems: cartItems.length > 0,
    isAuthenticated: error !== 'no_auth',
  };
};

// 🪝 Hook simplificado solo para obtener el contador
export const useCarritoContador = () => {
  const { cantidadTotal, loading, hasItems } = useCarrito();
  
  return {
    cantidadTotal,
    loading,
    hasItems,
  };
};