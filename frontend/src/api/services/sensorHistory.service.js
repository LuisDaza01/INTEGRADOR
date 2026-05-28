// Hook para leer el histórico de sensores desde PostgreSQL
// (backend lo persiste vía sensorBridge cada 30 s).
import { useState, useEffect, useCallback } from "react"
import axios from "../config/axios"

// Mapea los rangos visibles a los parámetros del endpoint
const RANGE_CONFIG = {
  "1h":  { ms: 60 * 60 * 1000,         bucket: "raw",  limit: 720  },  // ~720 muestras crudas máx
  "24h": { ms: 24 * 60 * 60 * 1000,    bucket: "hour", limit: 48   },  // 24 puntos
  "7d":  { ms: 7  * 24 * 60 * 60 * 1000, bucket: "hour", limit: 200 },  // ~168 puntos (1 por hora)
  "30d": { ms: 30 * 24 * 60 * 60 * 1000, bucket: "day",  limit: 60  },  // 30 puntos
}

// GET /api/lagunas — listado de las lagunas del productor logueado
export async function fetchMisLagunas() {
  const res = await axios.get("/lagunas")
  const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  return data
}

// GET /api/lagunas/:id/sensores/history
// Devuelve [{ ts, temperatura, ph, turbidez, nivel, oxigeno, muestras? }]
export async function fetchSensorHistory(lagunaId, range = "24h") {
  if (!lagunaId) return []
  const cfg = RANGE_CONFIG[range] || RANGE_CONFIG["24h"]
  const hasta = new Date()
  const desde = new Date(hasta.getTime() - cfg.ms)
  const res = await axios.get(`/lagunas/${lagunaId}/sensores/history`, {
    params: {
      desde:  desde.toISOString(),
      hasta:  hasta.toISOString(),
      bucket: cfg.bucket,
      limit:  cfg.limit,
    },
  })
  const payload = res.data?.data || res.data
  const points  = payload?.points || []
  // Normaliza: timestamp como number (ms) para recharts
  return points.map(p => ({
    timestamp:   new Date(p.ts).getTime(),
    temperatura: p.temperatura != null ? parseFloat(p.temperatura) : null,
    ph:          p.ph          != null ? parseFloat(p.ph)          : null,
    turbidez:    p.turbidez    != null ? parseFloat(p.turbidez)    : null,
    nivel:       p.nivel       != null ? parseFloat(p.nivel)       : null,
    oxigeno:     p.oxigeno     != null ? parseFloat(p.oxigeno)     : null,
  }))
}

// Hook combinado: descubre la primera laguna del productor y trae su histórico.
// Si `lagunaIdProp` viene, lo usa directo (útil cuando agreguemos un selector).
export function useSensorHistory(range = "24h", lagunaIdProp = null) {
  const [lagunaId, setLagunaId] = useState(lagunaIdProp)
  const [points,   setPoints]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [lagunas,  setLagunas]  = useState([])

  // Cargar lagunas del productor solo si no nos pasaron un id
  useEffect(() => {
    if (lagunaIdProp) {
      setLagunaId(lagunaIdProp)
      return
    }
    let alive = true
    fetchMisLagunas()
      .then(list => {
        if (!alive) return
        setLagunas(list)
        const conSensor = list.find(l => l.codigo_dispositivo)
        const primera   = conSensor || list[0]
        if (primera) setLagunaId(primera.id)
      })
      .catch(e => alive && setError(e))
    return () => { alive = false }
  }, [lagunaIdProp])

  const load = useCallback(async () => {
    if (!lagunaId) return
    setLoading(true); setError(null)
    try {
      const pts = await fetchSensorHistory(lagunaId, range)
      setPoints(pts)
    } catch (e) {
      setError(e)
      setPoints([])
    } finally {
      setLoading(false)
    }
  }, [lagunaId, range])

  useEffect(() => { load() }, [load])

  return { points, loading, error, lagunaId, lagunas, refresh: load }
}
