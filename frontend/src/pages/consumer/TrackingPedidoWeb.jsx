// ============================================================
// src/pages/consumer/TrackingPedidoWeb.jsx
// Seguimiento de pedido en tiempo real (estilo app móvil)
// URL: /dashboard-consumidor/tracking/:pedidoId
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../../api/config/axios'
import { useTheme } from '../../contexts/ThemeContext'
import {
  ArrowLeft, MapPin, Navigation, Package, CheckCircle,
  Truck, Fish, Phone, RefreshCw, AlertTriangle, Bike,
  ChevronRight, QrCode, Locate, MapIcon, Clock, Hammer,
} from 'lucide-react'

const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const SOCKET_URL = API_BASE.replace('/api', '')
const POLLING_INTERVAL = 15000

const ESTADOS = [
  { key: 'pendiente',          label: 'Pedido recibido',    icon: Package    },
  { key: 'confirmado',         label: 'Confirmado',         icon: CheckCircle },
  { key: 'preparando',         label: 'Preparando',         icon: Hammer     },
  { key: 'listo_para_recoger', label: 'Listo para recoger', icon: Package    },
  { key: 'en_camino',          label: 'En camino',          icon: Bike       },
  { key: 'entregado',          label: 'Entregado',          icon: CheckCircle },
]
const ESTADO_IDX = Object.fromEntries(ESTADOS.map((e, i) => [e.key, i]))

// ── Mapa con Leaflet — estilo oscuro app móvil ─────────────────
const MapaTracking = ({ pedido }) => {
  const mapRef    = useRef(null)
  const mapObj    = useRef(null)
  const markersRef = useRef({})
  const routeLayerRef = useRef(null)

  const paradaPos = pedido.parada_lat && pedido.parada_lng
    ? [parseFloat(pedido.parada_lat), parseFloat(pedido.parada_lng)]
    : null
  const conductorPos = pedido.conductor_lat && pedido.conductor_lng
    && String(pedido.conductor_lat) !== 'null'
    ? [parseFloat(pedido.conductor_lat), parseFloat(pedido.conductor_lng)]
    : null
  const destinoPos = pedido.consumidor_lat && pedido.consumidor_lng
    ? [parseFloat(pedido.consumidor_lat), parseFloat(pedido.consumidor_lng)]
    : null

  const fetchRoute = useCallback((origen, destino) => {
    if (!origen || !destino || !window.L || !mapObj.current) return
    const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.code !== 'Ok' || !data.routes?.length) return
        if (routeLayerRef.current) mapObj.current.removeLayer(routeLayerRef.current)
        routeLayerRef.current = window.L.geoJSON(data.routes[0].geometry, {
          style: { color: '#3B82F6', weight: 5, opacity: 0.95, lineJoin: 'round' },
        }).addTo(mapObj.current)
      })
      .catch(() => {})
  }, [])

  // Init map una sola vez
  useEffect(() => {
    if (mapObj.current) return
    const loadLeaflet = () => new Promise((resolve) => {
      if (window.L) { resolve(window.L); return }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve(window.L)
      document.head.appendChild(script)
    })

    loadLeaflet().then((L) => {
      if (!mapRef.current || mapObj.current) return
      const center = conductorPos || paradaPos || destinoPos || [-17.3895, -66.1568]

      mapObj.current = L.map(mapRef.current, {
        zoomControl: true, attributionControl: false,
      }).setView(center, 14)

      // Tile oscuro tipo app
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
      }).addTo(mapObj.current)

      const mkIcon = (color, label, size = 36, pulse = false) => L.divIcon({
        html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.45)}px;box-shadow:0 3px 10px rgba(0,0,0,0.5);${pulse ? 'animation:pulse-marker 1.5s infinite;' : ''}">${label}</div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
      })

      // Parada de recojo (naranja 📦)
      if (paradaPos) {
        markersRef.current.parada = L.marker(paradaPos, { icon: mkIcon('#F59E0B', '📦', 38) })
          .addTo(mapObj.current)
          .bindPopup(`<strong>Parada:</strong> ${pedido.parada_nombre || 'Punto de recojo'}`)
      }
      // Destino (rojo 🏠)
      if (destinoPos) {
        markersRef.current.destino = L.marker(destinoPos, { icon: mkIcon('#EF4444', '🏠', 38) })
          .addTo(mapObj.current)
          .bindPopup(`<strong>Destino:</strong> ${pedido.consumidor_direccion || 'Tu dirección'}`)
      }
      // Conductor (azul 🚴 pulsante)
      if (conductorPos) {
        markersRef.current.conductor = L.marker(conductorPos, { icon: mkIcon('#3B82F6', '🚴', 44, true) })
          .addTo(mapObj.current)
          .bindPopup(`<strong>${pedido.repartidor_nombre || 'Conductor'}</strong>`)
      }

      // FitBounds inicial
      const pts = [paradaPos, conductorPos, destinoPos].filter(Boolean)
      if (pts.length >= 2) {
        mapObj.current.fitBounds(pts, { padding: [50, 50] })
      }

      // Ruta real: conductor (o parada si aún no hay GPS) → destino
      const origen = conductorPos || paradaPos
      if (origen && destinoPos) fetchRoute(origen, destinoPos)
    })

    return () => {
      if (mapObj.current) {
        mapObj.current.remove()
        mapObj.current = null
        markersRef.current = {}
        routeLayerRef.current = null
      }
    }
  }, [])

  // Actualizar conductor en tiempo real + recalcular ruta
  useEffect(() => {
    const L = window.L
    if (!L || !mapObj.current || !conductorPos) return

    if (markersRef.current.conductor) {
      markersRef.current.conductor.setLatLng(conductorPos)
    } else {
      const icon = L.divIcon({
        html: `<div style="background:#3B82F6;width:44px;height:44px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,0.5);animation:pulse-marker 1.5s infinite;">🚴</div>`,
        iconSize: [44, 44], iconAnchor: [22, 22], className: '',
      })
      markersRef.current.conductor = L.marker(conductorPos, { icon })
        .addTo(mapObj.current)
        .bindPopup(`<strong>${pedido.repartidor_nombre || 'Conductor'}</strong>`)
    }
    if (destinoPos) fetchRoute(conductorPos, destinoPos)
  }, [pedido.conductor_lat, pedido.conductor_lng])

  const recentrar = () => {
    if (!mapObj.current) return
    const pts = [paradaPos, conductorPos, destinoPos].filter(Boolean)
    if (pts.length >= 2) mapObj.current.fitBounds(pts, { padding: [50, 50], animate: true })
    else if (pts.length === 1) mapObj.current.setView(pts[0], 15, { animate: true })
  }

  const sinCoordenadas = !conductorPos && !paradaPos && !destinoPos

  if (sinCoordenadas) {
    return (
      <div style={{ height: 256, background: 'rgba(34,197,94,0.04)', borderRadius: 14, border: '1px dashed rgba(34,197,94,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <MapPin size={32} style={{ color: '#22C55E', opacity: 0.4, marginBottom: 8 }} />
        <p style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, margin: 0 }}>Mapa no disponible</p>
        <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Las coordenadas aún no están registradas</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <style>{`
        @keyframes pulse-marker {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.15); }
        }
        .leaflet-control-zoom a {
          background: #1a2744 !important; color: #94a3b8 !important; border-color: #2d3f6b !important;
        }
        .leaflet-control-zoom a:hover { background: #2d3f6b !important; color: #fff !important; }
      `}</style>
      <div ref={mapRef} style={{ height: '60vh', minHeight: 420, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />

      {/* Botón centrar */}
      <button onClick={recentrar}
        title="Centrar mapa"
        style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 401, color: '#22C55E' }}>
        <Locate size={20} />
      </button>

      {/* Leyenda flotante */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(10,15,30,0.92)', border: '1px solid rgba(34,197,94,0.25)', backdropFilter: 'blur(10px)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', fontSize: 11, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 401 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} /> Parada de recojo</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }} /> Conductor</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} /> Tu dirección</span>
      </div>
    </div>
  )
}

// ── Timeline horizontal (pasos) ────────────────────────────────
const TimelineEstados = ({ estadoActual, D }) => {
  const idxActual = ESTADO_IDX[estadoActual] ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {ESTADOS.map((e, i) => {
        const done    = i < idxActual
        const current = i === idxActual
        const bg     = done ? '#22C55E' : current ? D.primary : D.surface
        const border = done ? '#22C55E' : current ? D.primary : D.border
        return (
          <div key={e.key} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${border}`, background: bg, transition: 'all 0.2s', boxShadow: current ? `0 0 0 4px ${D.primary}20, 0 0 16px ${D.primary}60` : 'none', animation: current ? 'pulse 2s infinite' : 'none' }}>
                {done ? (
                  <CheckCircle size={16} color="#fff" />
                ) : (
                  <e.icon size={16} color={current ? '#fff' : D.dim || D.muted} />
                )}
              </div>
              <span style={{ fontSize: 10, marginTop: 6, textAlign: 'center', lineHeight: 1.2, maxWidth: 70, color: current ? D.primary : done ? '#22C55E' : D.muted, fontWeight: current ? 600 : 400 }} className="hidden sm:block">{e.label}</span>
            </div>
            {i < ESTADOS.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 4px', marginTop: -20, background: i < idxActual ? '#22C55E' : D.border }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
const TrackingPedidoWeb = () => {
  const { pedidoId } = useParams()
  const navigate     = useNavigate()
  const { D }        = useTheme()
  const [pedido, setPedido]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [socketVivo, setSocketVivo] = useState(false)
  const pollingRef = useRef(null)
  const socketRef  = useRef(null)
  const mapaRef    = useRef(null)

  const fetchTracking = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true)
      const res = await api.get(`${API_BASE}/pedidos/${pedidoId}/tracking`)
      setPedido(res.data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      if (!silencioso) {
        setError(err.response?.status === 404
          ? 'Pedido no encontrado'
          : 'Error al cargar el tracking')
      }
    } finally {
      setLoading(false)
    }
  }, [pedidoId])

  // Socket.IO en vivo
  useEffect(() => {
    if (!localStorage.getItem('usuario')) return
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    })
    socket.on('connect', () => {
      socket.emit('join_tracking', pedidoId)
      setSocketVivo(true)
    })
    socket.on('disconnect', () => setSocketVivo(false))
    socket.on('ubicacion_conductor', ({ lat, lng }) => {
      setPedido(prev => prev ? { ...prev, conductor_lat: lat, conductor_lng: lng } : prev)
      setLastUpdate(new Date())
    })
    socketRef.current = socket
    return () => {
      socket.emit('leave_tracking', pedidoId)
      socket.disconnect()
      socketRef.current = null
      setSocketVivo(false)
    }
  }, [pedidoId])

  // Polling de respaldo (estado completo)
  useEffect(() => {
    fetchTracking()
    pollingRef.current = setInterval(() => fetchTracking(true), POLLING_INTERVAL)
    return () => clearInterval(pollingRef.current)
  }, [fetchTracking])

  // Detener polling cuando ya está entregado/cancelado
  useEffect(() => {
    if (pedido?.estado === 'entregado' || pedido?.estado === 'cancelado') {
      clearInterval(pollingRef.current)
    }
  }, [pedido?.estado])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, background: D.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(34,197,94,0.12)', border: `1px solid ${D.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', animation: 'pulse 2s infinite' }}>
          <Truck size={28} style={{ color: D.primary }} />
        </div>
        <p style={{ color: D.muted, fontWeight: 600 }}>Cargando tracking...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ padding: 24, background: D.bg, minHeight: '100vh' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: D.muted, marginBottom: 16, fontSize: 13, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <ArrowLeft size={16} /> Volver
      </button>
      <div style={{ background: `${D.red}15`, border: `1px solid ${D.red}40`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <AlertTriangle size={32} style={{ color: D.red, margin: '0 auto 8px' }} />
        <p style={{ color: D.red, fontWeight: 600, margin: 0 }}>{error}</p>
      </div>
    </div>
  )

  if (!pedido) return null

  const estadoIdx   = ESTADO_IDX[pedido.estado] ?? 0
  const estadoActual = ESTADOS[estadoIdx] || ESTADOS[0]
  const isEnCamino  = pedido.estado === 'en_camino'
  const isEntregado = pedido.estado === 'entregado'
  const isCancelado = pedido.estado === 'cancelado'

  // Color según estado (dark theme)
  const colorEstado = isCancelado ? 'red' : isEntregado ? 'green' : isEnCamino ? 'primary' : 'gray'
  const colorClasses = {
    red:     { bg: `${D.red}12`,     border: `${D.red}50`,     text: D.red,     icon: D.red },
    green:   { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',  text: '#4ade80', icon: '#22C55E' },
    primary: { bg: `${D.primary}15`, border: `${D.primary}40`, text: D.primary, icon: D.primary },
    gray:    { bg: D.surface,        border: D.border,         text: D.text,    icon: D.muted },
  }[colorEstado]

  const tieneMapa = !!(pedido.parada_lat || pedido.consumidor_lat)
  const mostrarMapa = tieneMapa && (isEnCamino || pedido.conductor_lat || ['confirmado','preparando','listo_para_recoger'].includes(pedido.estado))

  const scrollAlMapa = () => mapaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const cardStyle = { background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }

  return (
    <div style={{ padding: 24, paddingBottom: 32, background: D.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: 8, background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, cursor: 'pointer', color: D.text }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: 0 }}>Seguimiento del pedido</h2>
            {lastUpdate && (
              <p style={{ fontSize: 11, color: D.muted, display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0 0' }}>
                <RefreshCw size={12} />
                Actualizado {lastUpdate.toLocaleTimeString('es-BO')}
              </p>
            )}
          </div>
        </div>
        {!isCancelado && !isEntregado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: D.card, border: `1px solid ${D.border}`, borderRadius: 999, padding: '6px 12px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: socketVivo ? '#22C55E' : '#fbbf24', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: socketVivo ? '#4ade80' : '#fbbf24' }}>
              {socketVivo ? 'En vivo' : 'Actualizando…'}
            </span>
          </div>
        )}
      </div>

      {/* ── Banner "En camino" ── */}
      {isEnCamino && (
        <button onClick={scrollAlMapa}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, background: `linear-gradient(135deg, ${D.primary}, #16a34a)`, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
            <Bike size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>¡Tu conductor está en camino!</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 }}>Toca para ver la ruta en tiempo real →</p>
          </div>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </button>
      )}

      {/* ── Código de retiro (prominente) ── */}
      {pedido.codigo_retiro && (
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderColor: `${D.primary}50`, borderWidth: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: D.muted }}>
            <QrCode size={16} style={{ color: D.primary }} />
            <span>Código de tu pedido</span>
          </div>
          <p style={{ fontSize: 30, fontWeight: 800, color: D.primary, letterSpacing: '0.4em', margin: 0, textShadow: `0 0 24px ${D.primary}60` }}>
            {pedido.codigo_retiro}
          </p>
          <p style={{ fontSize: 11, color: D.muted, textAlign: 'center', maxWidth: 400, margin: 0 }}>
            El productor usa este código para entregar al conductor
          </p>
        </div>
      )}

      {/* ── Estado actual (card grande) ── */}
      {isCancelado ? (
        <div style={{ background: `${D.red}12`, border: `2px solid ${D.red}50`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <AlertTriangle size={40} style={{ color: D.red, margin: '0 auto 8px', display: 'block' }} />
          <p style={{ color: D.red, fontWeight: 700, fontSize: 20, margin: 0 }}>Pedido cancelado</p>
        </div>
      ) : (
        <div style={{ background: colorClasses.bg, border: `2px solid ${colorClasses.border}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <estadoActual.icon size={40} style={{ color: colorClasses.icon, margin: '0 auto 8px', display: 'block', animation: isEnCamino ? 'pulse 2s infinite' : 'none' }} />
          <p style={{ color: colorClasses.text, fontWeight: 700, fontSize: 20, margin: 0 }}>{estadoActual.label}</p>
          {pedido.fecha_recogida && estadoIdx >= ESTADO_IDX['en_camino'] && (
            <p style={{ fontSize: 11, color: D.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 }}>
              <Clock size={12} />
              Recogido: {new Date(pedido.fecha_recogida).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {tieneMapa && ['confirmado','preparando','listo_para_recoger','en_camino'].includes(pedido.estado) && (
            <button onClick={scrollAlMapa}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', marginTop: 12, background: `${D.primary}20`, color: D.primary, border: `1px solid ${D.primary}40`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <MapIcon size={16} />
              {isEnCamino ? 'Ver conductor en el mapa →' : 'Ver ruta planificada →'}
            </button>
          )}
        </div>
      )}

      {/* ── Timeline horizontal ── */}
      {!isCancelado && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: D.muted, marginBottom: 16 }}>Progreso del pedido</h3>
          <TimelineEstados estadoActual={pedido.estado} D={D} />
        </div>
      )}

      {/* ── Mapa ── */}
      {mostrarMapa && (
        <div ref={mapaRef} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, color: D.text, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Navigation size={20} style={{ color: D.primary }} />
              Seguimiento en tiempo real
            </h3>
            {isEnCamino && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 600, border: '1px solid rgba(34,197,94,0.3)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
                {socketVivo ? 'En vivo' : 'Polling'}
              </span>
            )}
          </div>
          <MapaTracking pedido={pedido} />
          {isEnCamino && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, color: D.muted }}>
              <RefreshCw size={12} style={{ animation: 'spin 3s linear infinite' }} />
              Ubicación en tiempo real
            </div>
          )}
        </div>
      )}

      {/* ── Conductor card ── */}
      {(pedido.repartidor_nombre || isEnCamino) && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: D.muted, marginBottom: 12 }}>Tu conductor</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, background: `${D.primary}20`, border: `1px solid ${D.primary}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bike size={24} style={{ color: D.primary }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: D.text, fontSize: 15, margin: 0 }}>
                {pedido.repartidor_nombre || 'Conductor asignado'}
              </p>
              <p style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                Pedido #{pedido.id}{pedido.codigo_retiro ? ` · ${pedido.codigo_retiro}` : ''}
              </p>
            </div>
            {pedido.repartidor_telefono && (
              <a href={`tel:${pedido.repartidor_telefono}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: `linear-gradient(135deg, ${D.primary}, #16a34a)`, color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: `0 4px 12px ${D.primary}40` }}>
                <Phone size={16} />
                Llamar
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Detalles del pedido ── */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: 700, color: D.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={20} style={{ color: D.muted }} />
          Detalles del pedido
        </h3>
        <div style={{ fontSize: 13 }}>
          <Detalle label="Total" valor={`Bs. ${parseFloat(pedido.total || 0).toFixed(2)}`} bold D={D} />
          {pedido.consumidor_direccion && (
            <Detalle label="Dirección" valor={pedido.consumidor_direccion} D={D} />
          )}
          {pedido.fecha_pedido && (
            <Detalle label="Fecha del pedido" valor={new Date(pedido.fecha_pedido).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })} D={D} />
          )}
          {pedido.fecha_entrega_real && (
            <Detalle label="Entregado" valor={new Date(pedido.fecha_entrega_real).toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} valorColor="#22C55E" D={D} />
          )}
        </div>
      </div>

      {/* ── Banner entregado ── */}
      {isEntregado && (
        <div style={{ background: 'rgba(34,197,94,0.12)', borderRadius: 14, border: '1px solid rgba(34,197,94,0.3)', padding: 20, textAlign: 'center' }}>
          <CheckCircle size={40} style={{ color: '#22C55E', margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontWeight: 700, color: '#4ade80', fontSize: 17, margin: 0 }}>¡Pedido entregado!</p>
          <p style={{ color: '#86efac', fontSize: 13, marginTop: 4 }}>Gracias por confiar en NaturaPiscis</p>
        </div>
      )}

      {!isCancelado && !isEntregado && (
        <p style={{ textAlign: 'center', fontSize: 11, color: D.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <RefreshCw size={12} />
          Se actualiza automáticamente cada 15 segundos
        </p>
      )}
      </div>
    </div>
  )
}

const Detalle = ({ label, valor, bold = false, valorColor, D }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${D.border}` }}>
    <span style={{ color: D.muted }}>{label}</span>
    <span style={{ textAlign: 'right', maxWidth: 320, color: valorColor || (bold ? D.text : D.text), fontWeight: bold ? 700 : 500 }}>
      {valor}
    </span>
  </div>
)

export default TrackingPedidoWeb
