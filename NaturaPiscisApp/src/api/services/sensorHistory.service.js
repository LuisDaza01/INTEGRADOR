// Histórico de sensores desde PostgreSQL (backend lo persiste vía sensorBridge).
// Equivalente al servicio web en frontend/src/api/services/sensorHistory.service.js
import { useState, useEffect, useCallback } from 'react';
import api from '../axios.config';

const RANGE_CONFIG = {
  '1h':  { ms: 60 * 60 * 1000,           bucket: 'raw',  limit: 720 },
  '24h': { ms: 24 * 60 * 60 * 1000,      bucket: 'hour', limit: 48  },
  '7d':  { ms: 7  * 24 * 60 * 60 * 1000, bucket: 'hour', limit: 200 },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, bucket: 'day',  limit: 60  },
};

export async function fetchSensorHistory(lagunaId, range = '24h') {
  if (!lagunaId) return [];
  const cfg = RANGE_CONFIG[range] || RANGE_CONFIG['24h'];
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - cfg.ms);

  const res = await api.get(`/lagunas/${lagunaId}/sensores/history`, {
    params: {
      desde:  desde.toISOString(),
      hasta:  hasta.toISOString(),
      bucket: cfg.bucket,
      limit:  cfg.limit,
    },
  });
  const payload = res.data?.data || res.data;
  const points  = payload?.points || [];
  return points.map(p => ({
    timestamp:   new Date(p.ts).getTime(),
    temperatura: p.temperatura != null ? parseFloat(p.temperatura) : null,
    ph:          p.ph          != null ? parseFloat(p.ph)          : null,
    turbidez:    p.turbidez    != null ? parseFloat(p.turbidez)    : null,
    nivel:       p.nivel       != null ? parseFloat(p.nivel)       : null,
    oxigeno:     p.oxigeno     != null ? parseFloat(p.oxigeno)     : null,
  }));
}

// Hook: dado un lagunaId y un rango, devuelve un mapa de arrays de valores
// (plano, como espera MiniChart en MonitoringScreen):
//   { temperatura: [25.1, 25.3, ...], ph: [...], turbidez: [...] }
export function useSensorHistory(lagunaId, range = '24h') {
  const [historyMap, setHistoryMap] = useState({ temperatura: [], ph: [], turbidez: [] });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [count,      setCount]      = useState(0);

  const load = useCallback(async () => {
    if (!lagunaId) {
      setHistoryMap({ temperatura: [], ph: [], turbidez: [] });
      setCount(0);
      return;
    }
    setLoading(true); setError(null);
    try {
      const points = await fetchSensorHistory(lagunaId, range);
      const map = { temperatura: [], ph: [], turbidez: [] };
      points.forEach(p => {
        if (p.temperatura != null) map.temperatura.push(p.temperatura);
        if (p.ph          != null) map.ph.push(p.ph);
        if (p.turbidez    != null) map.turbidez.push(p.turbidez);
      });
      setHistoryMap(map);
      setCount(points.length);
    } catch (e) {
      setError(e);
      setHistoryMap({ temperatura: [], ph: [], turbidez: [] });
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [lagunaId, range]);

  useEffect(() => { load(); }, [load]);

  return { historyMap, loading, error, count, refresh: load };
}
