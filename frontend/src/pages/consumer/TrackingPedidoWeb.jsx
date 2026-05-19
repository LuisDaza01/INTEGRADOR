// ============================================================
// src/pages/consumer/TrackingPedidoWeb.jsx
// Seguimiento de pedido en tiempo real (estilo app móvil)
// URL: /dashboard-consumidor/tracking/:pedidoId
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../../api/config/axios'
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
      <div className="h-64 bg-gray-100 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center">
        <MapPin className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-gray-500 text-sm font-medium">Mapa no disponible</p>
        <p className="text-gray-400 text-xs mt-1">Las coordenadas aún no están registradas</p>
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
      <div ref={mapRef} className="rounded-xl overflow-hidden border border-gray-800 shadow-lg" style={{ height: '60vh', minHeight: 420 }} />

      {/* Botón centrar */}
      <button onClick={recentrar}
        className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-[401]"
        title="Centrar mapa">
        <Locate className="h-5 w-5 text-gray-700" />
      </button>

      {/* Leyenda flotante */}
      <div className="absolute bottom-3 left-3 bg-white bg-opacity-95 backdrop-blur rounded-lg px-3 py-2 shadow-lg text-xs flex flex-col gap-1.5 z-[401]">
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Parada de recojo</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Conductor</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Tu dirección</span>
      </div>
    </div>
  )
}

// ── Timeline horizontal (pasos) ────────────────────────────────
const TimelineEstados = ({ estadoActual }) => {
  const idxActual = ESTADO_IDX[estadoActual] ?? 0
  return (
    <div className="flex items-center gap-0">
      {ESTADOS.map((e, i) => {
        const done    = i < idxActual
        const current = i === idxActual
        return (
          <div key={e.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done    ? 'bg-green-500 border-green-500'    :
                current ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100 animate-pulse' :
                          'bg-white border-gray-200'
              }`}>
                {done ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : (
                  <e.icon className={`h-4 w-4 ${current ? 'text-white' : 'text-gray-300'}`} />
                )}
              </div>
              <span className={`text-xs mt-1.5 text-center leading-tight max-w-[70px] hidden sm:block ${
                current ? 'text-blue-600 font-semibold' :
                done    ? 'text-green-600' :
                          'text-gray-400'
              }`}>{e.label}</span>
            </div>
            {i < ESTADOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 -mt-4 sm:-mt-5 ${
                i < idxActual ? 'bg-green-400' : 'bg-gray-200'
              }`} />
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
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
          <Truck className="h-7 w-7 text-blue-600" />
        </div>
        <p className="text-gray-600 font-medium">Cargando tracking...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    </div>
  )

  if (!pedido) return null

  const estadoIdx   = ESTADO_IDX[pedido.estado] ?? 0
  const estadoActual = ESTADOS[estadoIdx] || ESTADOS[0]
  const isEnCamino  = pedido.estado === 'en_camino'
  const isEntregado = pedido.estado === 'entregado'
  const isCancelado = pedido.estado === 'cancelado'

  // Color según estado
  const colorEstado = isCancelado ? 'red' : isEntregado ? 'green' : isEnCamino ? 'blue' : 'gray'
  const colorClasses = {
    red:   { bg: 'bg-red-50',   border: 'border-red-300',   text: 'text-red-600',   icon: 'text-red-500' },
    green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: 'text-green-500' },
    blue:  { bg: 'bg-blue-50',  border: 'border-blue-300',  text: 'text-blue-700',  icon: 'text-blue-500' },
    gray:  { bg: 'bg-gray-50',  border: 'border-gray-300',  text: 'text-gray-700',  icon: 'text-gray-500' },
  }[colorEstado]

  const tieneMapa = !!(pedido.parada_lat || pedido.consumidor_lat)
  const mostrarMapa = tieneMapa && (isEnCamino || pedido.conductor_lat || ['confirmado','preparando','listo_para_recoger'].includes(pedido.estado))

  const scrollAlMapa = () => mapaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="space-y-4 pb-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Seguimiento del pedido</h2>
            {lastUpdate && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <RefreshCw className="h-3 w-3" />
                Actualizado {lastUpdate.toLocaleTimeString('es-BO')}
              </p>
            )}
          </div>
        </div>
        {!isCancelado && !isEntregado && (
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${socketVivo ? 'bg-green-500' : 'bg-blue-400'} animate-pulse`} />
            <span className={`text-xs font-bold ${socketVivo ? 'text-green-600' : 'text-blue-500'}`}>
              {socketVivo ? 'En vivo' : 'Actualizando…'}
            </span>
          </div>
        )}
      </div>

      {/* ── Banner "En camino" ── */}
      {isEnCamino && (
        <button onClick={scrollAlMapa}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all">
          <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Bike className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-sm">¡Tu conductor está en camino!</p>
            <p className="text-blue-100 text-xs mt-0.5">Toca para ver la ruta en tiempo real →</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70" />
        </button>
      )}

      {/* ── Código de retiro (prominente) ── */}
      {pedido.codigo_retiro && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <QrCode className="h-4 w-4 text-blue-600" />
            <span>Código de tu pedido</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 tracking-[0.4em]">
            {pedido.codigo_retiro}
          </p>
          <p className="text-xs text-gray-500 text-center max-w-md">
            El productor usa este código para entregar al conductor
          </p>
        </div>
      )}

      {/* ── Estado actual (card grande) ── */}
      {isCancelado ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center space-y-2">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-red-700 font-bold text-xl">Pedido cancelado</p>
        </div>
      ) : (
        <div className={`${colorClasses.bg} border-2 ${colorClasses.border} rounded-xl p-6 text-center space-y-2`}>
          <estadoActual.icon className={`h-10 w-10 ${colorClasses.icon} mx-auto ${isEnCamino ? 'animate-pulse' : ''}`} />
          <p className={`${colorClasses.text} font-bold text-xl`}>{estadoActual.label}</p>
          {pedido.fecha_recogida && estadoIdx >= ESTADO_IDX['en_camino'] && (
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Recogido: {new Date(pedido.fecha_recogida).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {tieneMapa && ['confirmado','preparando','listo_para_recoger','en_camino'].includes(pedido.estado) && (
            <button onClick={scrollAlMapa}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors">
              <MapIcon className="h-4 w-4" />
              {isEnCamino ? 'Ver conductor en el mapa →' : 'Ver ruta planificada →'}
            </button>
          )}
        </div>
      )}

      {/* ── Timeline horizontal ── */}
      {!isCancelado && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Progreso del pedido</h3>
          <TimelineEstados estadoActual={pedido.estado} />
        </div>
      )}

      {/* ── Mapa ── */}
      {mostrarMapa && (
        <div ref={mapaRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Seguimiento en tiempo real
            </h3>
            {isEnCamino && (
              <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {socketVivo ? 'En vivo' : 'Polling'}
              </span>
            )}
          </div>
          <MapaTracking pedido={pedido} />
          {isEnCamino && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              Ubicación en tiempo real
            </div>
          )}
        </div>
      )}

      {/* ── Conductor card ── */}
      {(pedido.repartidor_nombre || isEnCamino) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tu conductor</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bike className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base">
                {pedido.repartidor_nombre || 'Conductor asignado'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pedido #{pedido.id}{pedido.codigo_retiro ? ` · ${pedido.codigo_retiro}` : ''}
              </p>
            </div>
            {pedido.repartidor_telefono && (
              <a href={`tel:${pedido.repartidor_telefono}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Phone className="h-4 w-4" />
                Llamar
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Detalles del pedido ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-400" />
          Detalles del pedido
        </h3>
        <div className="space-y-1 text-sm">
          <Detalle label="Total" valor={`Bs. ${parseFloat(pedido.total || 0).toFixed(2)}`} bold />
          {pedido.consumidor_direccion && (
            <Detalle label="Dirección" valor={pedido.consumidor_direccion} />
          )}
          {pedido.fecha_pedido && (
            <Detalle label="Fecha del pedido" valor={new Date(pedido.fecha_pedido).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
          {pedido.fecha_entrega_real && (
            <Detalle label="Entregado" valor={new Date(pedido.fecha_entrega_real).toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} valorClass="text-green-600 font-medium" />
          )}
        </div>
      </div>

      {/* ── Banner entregado ── */}
      {isEntregado && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-800 text-lg">¡Pedido entregado!</p>
          <p className="text-green-600 text-sm mt-1">Gracias por confiar en NaturaPiscis</p>
        </div>
      )}

      {!isCancelado && !isEntregado && (
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Se actualiza automáticamente cada 15 segundos
        </p>
      )}
    </div>
  )
}

const Detalle = ({ label, valor, bold = false, valorClass = '' }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className={`text-right max-w-xs ${bold ? 'font-bold text-gray-900' : 'text-gray-700'} ${valorClass}`}>
      {valor}
    </span>
  </div>
)

export default TrackingPedidoWeb
