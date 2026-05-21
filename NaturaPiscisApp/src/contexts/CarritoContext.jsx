// src/contexts/CarritoContext.jsx
// Conteo global del carrito para el badge del tab bar.
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { obtenerCantidadItems } from '../api/services/carrito.service';
import { useAuth } from './AuthContext';

const CarritoContext = createContext(null);

export const CarritoProvider = ({ children }) => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const n = await obtenerCantidadItems();
      setCount(n || 0);
    } catch {
      setCount(0);
    }
  }, []);

  // Refrescar al iniciar sesión / cambiar de usuario; limpiar al salir.
  useEffect(() => {
    if (user) refresh();
    else setCount(0);
  }, [user, refresh]);

  return (
    <CarritoContext.Provider value={{ count, refresh, setCount }}>
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
};

export default CarritoContext;
