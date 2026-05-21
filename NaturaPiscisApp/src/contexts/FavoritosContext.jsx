// src/contexts/FavoritosContext.jsx
// Favoritos globales — fuente única de verdad, persistida en AsyncStorage.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = 'favoritos_ids';
const FavoritosContext = createContext(null);

export const FavoritosProvider = ({ children }) => {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setIds(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const persist = useCallback((next) => {
    setIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const isFavorito = useCallback((productoId) => ids.includes(productoId), [ids]);

  const toggle = useCallback((productoId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const yaEsta = ids.includes(productoId);
    const next = yaEsta ? ids.filter(i => i !== productoId) : [...ids, productoId];
    persist(next);
    return !yaEsta;
  }, [ids, persist]);

  return (
    <FavoritosContext.Provider value={{ ids, isFavorito, toggle }}>
      {children}
    </FavoritosContext.Provider>
  );
};

export const useFavoritos = () => {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de FavoritosProvider');
  return ctx;
};

export default FavoritosContext;
