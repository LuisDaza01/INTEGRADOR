// ============================================================
// src/pages/public/TrazabilidadPublica.jsx
// Página pública — se abre al escanear el QR del producto
// URL: /trazabilidad/:productoId
// No requiere login
// ============================================================
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  Fish, MapPin, Thermometer, Waves, Eye, CheckCircle,
  Clock, Package, User, Star, Leaf, Shield, Award,
  ExternalLink, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ── Componente de línea de tiempo ─────────────────────────────
const TimelineStep = ({ icon: Icon, title, subtitle, date, color, active, last }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        active ? `bg-${color}-100 border-2 border-${color}-500` : 'bg-gray-100 border-2 border-gray-200'
      }`}>
        <Icon className={`h-5 w-5 ${active ? `text-${color}-600` : 'text-gray-400'}`} />
      </div>
      {!last && <div className={`w-0.5 h-8 mt-1 ${active ? `bg-${color}-200` : 'bg-gray-200'}`} />}
    </div>
    <div className="pb-6 flex-1">
      <p className={`font-semibold text-sm ${active ? 'text-gray-900' : 'text-gray-400'}`}>{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      {date && <p className="text-xs text-gray-400 mt-1">{date}</p>}
    </div>
  </div>
)

// ── Badge de parámetro ─────────────────────────────────────────
const ParamBadge = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${color}-50 border border-${color}-200`}>
    <Icon className={`h-4 w-4 text-${color}-600 flex-shrink-0`} />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold text-${color}-700`}>{value}</p>
    </div>
  </div>
)

// ── Componente principal ───────────────────────────────────────
const TrazabilidadPublica = () => {
  const { productoId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showParams, setShowParams] = useState(false)

  useEffect(() => {
    const fetchTrazabilidad = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_BASE}/productos/${productoId}/trazabilidad`)
        setData(res.data.data)
      } catch (err) {
        setError(err.response?.status === 404
          ? 'Producto no encontrado'
          : 'Error al cargar la trazabilidad')
      } finally {
        setLoading(false)
      }
    }
    if (productoId) fetchTrazabilidad()
  }, [productoId])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Fish className="h-8 w-8 text-teal-600" />
        </div>
        <p className="text-gray-600 font-medium">Cargando trazabilidad...</p>
        <p className="text-gray-400 text-sm mt-1">Verificando origen del producto</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-semibold">{error}</p>
        <p className="text-gray-500 text-sm mt-1">Verifica que el código QR sea válido</p>
      </div>
    </div>
  )

  if (!data) return null

  const { producto, productor, crianza, entrega, estadisticas } = data

  const fechaRegistro = new Date(producto.fechaRegistro).toLocaleDateString('es-BO', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  const fechaEntrega = entrega?.fechaEntrega
    ? new Date(entrega.fechaEntrega).toLocaleDateString('es-BO', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-gray-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Fish className="h-8 w-8 text-white" />
          </div>
          <p className="text-teal-100 text-sm font-medium uppercase tracking-wider mb-2">
            NaturaPiscis · Trazabilidad verificada
          </p>
          <h1 className="text-2xl font-bold">{producto.nombre}</h1>
          <p className="text-teal-100 text-sm mt-2">{producto.categoria}</p>

          {/* Sello de verificación */}
          <div className="inline-flex items-center gap-2 mt-4 bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Origen verificado · Monitoreo IoT 24/7
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="max-w-lg mx-auto px-4 -mt-8 pb-10 space-y-4">

        {/* Imagen del producto */}
        {producto.imagen && (
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="w-full h-48 object-cover"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        {/* ── Card: Línea de tiempo ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" />
            Recorrido del producto
          </h2>
          <TimelineStep
            icon={MapPin}
            title={`Criado en ${productor.ubicacion || 'Chapare, Bolivia'}`}
            subtitle={`${productor.empresa || productor.nombre} · ${crianza.especie}`}
            date={`Registrado el ${fechaRegistro}`}
            color="teal"
            active
          />
          <TimelineStep
            icon={Fish}
            title="Monitoreo continuo del agua"
            subtitle="Temperatura, pH y turbidez controlados con sensores ESP32"
            color="blue"
            active
          />
          <TimelineStep
            icon={Package}
            title="Cosechado y preparado"
            subtitle={`Por ${productor.empresa || productor.nombre}`}
            color="green"
            active
          />
          {entrega ? (
            <TimelineStep
              icon={CheckCircle}
              title="Entregado al consumidor"
              subtitle={`Repartidor: ${entrega.repartidor}`}
              date={fechaEntrega}
              color="green"
              active
              last
            />
          ) : (
            <TimelineStep
              icon={User}
              title="En camino a tu mesa"
              subtitle="Pendiente de entrega"
              color="gray"
              active={false}
              last
            />
          )}
        </div>

        {/* ── Card: Productor ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            Quién lo produjo
          </h2>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Fish className="h-6 w-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{productor.empresa || productor.nombre}</p>
              <p className="text-sm text-gray-500 mt-0.5">{productor.especialidad || 'Acuicultura'}</p>
              {productor.ubicacion && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-teal-500" />
                  {productor.ubicacion}
                </div>
              )}
              {productor.experiencia && (
                <p className="text-xs text-gray-400 mt-1">{productor.experiencia} años de experiencia</p>
              )}
            </div>
          </div>

          {productor.descripcion && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{productor.descripcion}</p>
          )}

          {productor.certificaciones && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
              <Award className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">{productor.certificaciones}</p>
            </div>
          )}
        </div>

        {/* ── Card: Parámetros de agua ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <button
            onClick={() => setShowParams(!showParams)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-teal-600" />
              Condiciones de crianza
            </h2>
            {showParams
              ? <ChevronUp className="h-5 w-5 text-gray-400" />
              : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>

          {showParams && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <ParamBadge
                  icon={Thermometer}
                  label="Temperatura del agua"
                  value={crianza.parametrosOptimos.temperatura}
                  color="red"
                />
                <ParamBadge
                  icon={Waves}
                  label="pH del agua"
                  value={crianza.parametrosOptimos.ph}
                  color="blue"
                />
                <ParamBadge
                  icon={Eye}
                  label="Turbidez"
                  value={crianza.parametrosOptimos.turbidez}
                  color="purple"
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-teal-800">Sistema de monitoreo</p>
                    <p className="text-xs text-teal-700 mt-0.5">{crianza.monitoreo}</p>
                    <p className="text-xs text-teal-600 mt-1">{crianza.alimentacion}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Card: Estadísticas ── */}
        {(estadisticas.totalPedidos > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-teal-600" />
              Este producto en números
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-teal-50 rounded-xl">
                <p className="text-3xl font-black text-teal-700">{estadisticas.totalPedidos}</p>
                <p className="text-xs text-gray-500 mt-1">pedidos completados</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-3xl font-black text-blue-700">{estadisticas.unidadesVendidas}</p>
                <p className="text-xs text-gray-500 mt-1">unidades vendidas</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center gap-2 text-teal-700 font-semibold">
            <Fish className="h-5 w-5" />
            <span>NaturaPiscis</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Plataforma de comercialización acuícola del Chapare, Bolivia
          </p>
          <p className="text-xs text-gray-300 mt-1">
            ID: {producto.id} · {new Date(data.generadoEn).toLocaleString('es-BO')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TrazabilidadPublica