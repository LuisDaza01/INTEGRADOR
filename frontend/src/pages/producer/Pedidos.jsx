"use client"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Filter, Download, RefreshCw, ChevronDown,
  Calendar, CheckCircle, XCircle, Clock, Truck, Package,
  Scale, Hourglass, Key, User, MapPin, Phone,
  ChevronRight, X,
} from "lucide-react"
import api from "../../api/config/axios"
import { API_ENDPOINTS } from "../../config/apiConfig"
import { useTheme } from "../../contexts/ThemeContext"

const PEDIDOS_REC_QK = ['pedidos', 'recibidos'];

const PRECIO_KG = 35

const STATUS_HEX = {
  yellow: '#f59e0b', blue: '#38bdf8', purple: '#a855f7',
  sky: '#0ea5e9', orange: '#fb923c', teal: '#14b8a6',
  green: '#22c55e', red: '#ef4444', gray: '#64748b',
}

const ORDER_STATES = {
  pendiente:              { label: 'Pendiente',           hex: '#f59e0b' },
  confirmado:             { label: 'Confirmado',          hex: '#38bdf8' },
  preparando:             { label: 'En Preparación',      hex: '#a855f7' },
  pesado:                 { label: 'Pesado',              hex: '#0ea5e9' },
  esperando_confirmacion: { label: 'Esp. confirmación',   hex: '#fb923c' },
  listo_para_recoger:     { label: 'Listo para recoger',  hex: '#fb923c' },
  en_camino:              { label: 'En Camino',           hex: '#14b8a6' },
  entregado:              { label: 'Entregado',           hex: '#22c55e' },
  cancelado:              { label: 'Cancelado',           hex: '#ef4444' },
}

const getBadgeStyle = (estado, D) => {
  const hex = ORDER_STATES[estado]?.hex || '#64748b'
  return { padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: `${hex}22`, color: hex, border: `1px solid ${hex}44` }
}

// ── Modal registrar peso ──────────────────────────────────────
const ModalRegistrarPeso = ({ pedido, onClose, onSuccess }) => {
  const { D } = useTheme()
  const [cantidad,  setCantidad]  = useState('')
  const [pesoKg,    setPesoKg]    = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const precioEstimado = pesoKg && !isNaN(parseFloat(pesoKg)) ? (parseFloat(pesoKg) * PRECIO_KG).toFixed(2) : null
  const pesoPromGramos = cantidad && pesoKg ? ((parseFloat(pesoKg) * 1000) / parseInt(cantidad)).toFixed(0) : null

  const handleGuardar = async () => {
    const cant = parseInt(cantidad)
    const peso = parseFloat(pesoKg)
    setError('')
    if (!cant || cant < 1) { setError('Ingresa una cantidad válida de pescados'); return }
    if (!peso || peso <= 0) { setError('Ingresa un peso válido en kg'); return }
    if ((peso * 1000) / cant < 800) {
      setError(`El peso promedio (${((peso * 1000) / cant).toFixed(0)}g) es menor al mínimo de 800g`)
      return
    }
    setGuardando(true)
    try {
      const res = await api.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/pedidos/${pedido.id}/pesar`,
        { cantidad_pescados: cant, peso_real_kg: peso }
      )
      onSuccess(res.data?.data || res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el peso')
    } finally {
      setGuardando(false)
    }
  }

  const inputSt = { width: '100%', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box', padding: '8px 12px' }
  const addonSt = { padding: '9px 12px', background: D.dim, borderRight: `1px solid ${D.border}`, color: D.muted, fontSize: 14, flexShrink: 0 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: D.card, borderRadius: 20, width: '100%', maxWidth: 'min(440px, 92vw)', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${D.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${D.border}` }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={18} style={{ color: D.teal }} /> Registrar peso
            </h2>
            <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>Pedido #{pedido.id} · {pedido.cliente?.nombre}</p>
          </div>
          <button onClick={onClose} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: D.muted, borderRadius: 8, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Cantidad */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 6 }}>Cantidad de pescados pesados</label>
            <div style={{ display: 'flex', border: `1px solid ${D.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <span style={addonSt}>🐟</span>
              <input type="number" min="1" placeholder="Ej: 8" value={cantidad} onChange={e => setCantidad(e.target.value)} style={{ ...inputSt, border: 'none', borderRadius: 0 }} />
              <span style={{ ...addonSt, borderRight: 'none', borderLeft: `1px solid ${D.border}` }}>pescados</span>
            </div>
          </div>
          {/* Peso */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 6 }}>Peso total en kg</label>
            <div style={{ display: 'flex', border: `1px solid ${D.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <span style={addonSt}>⚖️</span>
              <input type="number" min="0" step="0.01" placeholder="Ej: 7.20" value={pesoKg} onChange={e => setPesoKg(e.target.value)} style={{ ...inputSt, border: 'none', borderRadius: 0 }} />
              <span style={{ ...addonSt, borderRight: 'none', borderLeft: `1px solid ${D.border}` }}>kg</span>
            </div>
          </div>

          {/* Summary */}
          {precioEstimado && (
            <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: D.muted }}>Precio por kg:</span>
                <span style={{ fontWeight: 600, color: D.text }}>Bs. {PRECIO_KG}/kg</span>
              </div>
              {pesoPromGramos && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: D.muted }}>Peso prom. por pescado:</span>
                  <span style={{ fontWeight: 600, color: parseInt(pesoPromGramos) < 800 ? '#f87171' : '#4ade80' }}>
                    {pesoPromGramos}g {parseInt(pesoPromGramos) < 800 ? '⚠️ < 800g' : '✅'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(74,222,128,0.2)', marginTop: 2 }}>
                <span style={{ fontWeight: 700, color: D.text }}>💰 Total a cobrar:</span>
                <span style={{ fontWeight: 800, color: '#4ade80', fontSize: 20 }}>Bs. {precioEstimado}</span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
          <p style={{ fontSize: 12, color: D.dim, textAlign: 'center', margin: 0 }}>El consumidor recibirá una notificación. El tiempo de confirmación lo defines en tu perfil.</p>

          <button onClick={handleGuardar} disabled={guardando}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: guardando ? D.dim : 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', cursor: guardando ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {guardando ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><CheckCircle size={16} /> Confirmar y notificar al consumidor</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── PedidoRow ────────────────────────────────────────────────
const PedidoRow = ({ pedido, onConfirmar, onPesar, onRefresh }) => {
  const { D } = useTheme()
  const [expanded, setExpanded] = useState(false)

  const stateHex = ORDER_STATES[pedido.estado]?.hex || '#64748b'

  const getNextAction = () => {
    switch (pedido.estado) {
      case 'pendiente':         return { label: '✅ Confirmar pago QR',        bg: '#f59e0b', next: 'confirmado' }
      case 'confirmado':        return { label: '🔧 Iniciar preparación',       bg: D.primary, next: 'preparando' }
      case 'listo_para_recoger':return { label: '🚴 Marcar en camino',          bg: D.teal,   next: 'en_camino' }
      default: return null
    }
  }
  const action = getNextAction()

  const infoRowSt = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: D.text }
  const subCardSt = (accent) => ({ background: `${accent || D.surface}`, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' })

  return (
    <div className="np-hover" style={{ background: D.card, borderRadius: 14, borderLeft: `4px solid ${stateHex}`, border: `1px solid ${D.border}`, borderLeftWidth: 4, overflow: 'hidden', marginBottom: 10 }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', gap: 12 }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, color: D.text, fontSize: 14 }}>#{pedido.id}</span>
            <span style={getBadgeStyle(pedido.estado, D)}>{ORDER_STATES[pedido.estado]?.label || pedido.estado}</span>
          </div>
          <p style={{ fontSize: 12, color: D.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pedido.cliente?.nombre} · {pedido.fecha}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700, color: D.text, fontSize: 14, margin: 0 }}>
              Bs. {parseFloat(pedido.precio_final || pedido.total || 0).toFixed(2)}
            </p>
            {pedido.precio_final && <p style={{ fontSize: 11, color: D.green, margin: 0 }}>pesado</p>}
          </div>
          {action && pedido.estado === 'pendiente' && pedido.comprobante_url && (
            <button onClick={e => { e.stopPropagation(); setExpanded(true) }}
              style={{ padding: '6px 12px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📸 Ver comprobante
            </button>
          )}
          {action && !(pedido.estado === 'pendiente' && pedido.comprobante_url) && (
            <button onClick={e => { e.stopPropagation(); onConfirmar(pedido.id, action.next) }}
              style={{ padding: '6px 12px', background: action.bg, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {action.label}
            </button>
          )}
          {pedido.estado === 'preparando' && (
            <button onClick={e => { e.stopPropagation(); onPesar(pedido) }}
              style={{ padding: '6px 12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Scale size={12} /> Pesar
            </button>
          )}
          <ChevronRight size={16} style={{ color: D.muted, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            style={{ borderTop: `1px solid ${D.border}` }}>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
              {/* Cliente */}
              <div>
                <h4 style={{ fontWeight: 700, color: D.text, fontSize: 14, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} style={{ color: D.muted }} /> Cliente
                </h4>
                <div style={subCardSt(`${D.surface}`)}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={infoRowSt}><User size={14} style={{ color: D.muted }} />{pedido.cliente?.nombre}</div>
                    {pedido.cliente?.telefono && <div style={infoRowSt}><Phone size={14} style={{ color: D.muted }} />{pedido.cliente.telefono}</div>}
                    <div style={infoRowSt}><MapPin size={14} style={{ color: D.muted }} />{pedido.cliente?.direccion || 'Ver detalles'}</div>
                  </div>
                </div>
                {pedido.codigo_retiro && (
                  <div style={{ marginTop: 10, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 11, color: D.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Key size={11} /> Código para el conductor
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: D.primary, letterSpacing: 6, margin: '0 0 4px' }}>{pedido.codigo_retiro}</p>
                    <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>Pega este código en el paquete</p>
                  </div>
                )}
              </div>

              {/* Resumen + acciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pedido.comprobante_url && (
                  <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#a855f7', fontSize: 13, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      📸 Comprobante de pago QR
                    </h4>
                    <img src={pedido.comprobante_url} alt="Comprobante" style={{ width: '100%', borderRadius: 8, marginBottom: 10, maxHeight: 300, objectFit: 'contain', display: 'block' }} />
                    <a href={pedido.comprobante_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#a855f7', textDecoration: 'underline' }}>
                      Ver imagen completa ↗
                    </a>
                    {pedido.pago_verificado ? (
                      <div style={{ marginTop: 12, color: '#22c55e', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={15} /> Pago verificado
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={async () => {
                            try { await api.post(`/pedidos/${pedido.id}/verificar-pago`); onRefresh?.() }
                            catch { alert('No se pudo verificar el pago') }
                          }}
                          style={{ flex: 1, padding: '9px 0', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✅ Confirmar pago
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('¿Rechazar el comprobante? El consumidor deberá subirlo de nuevo.')) return
                            try { await api.post(`/pedidos/${pedido.id}/rechazar-pago`, { motivo: 'El comprobante no es válido' }); onRefresh?.() }
                            catch { alert('No se pudo rechazar el comprobante') }
                          }}
                          style={{ padding: '9px 14px', background: 'none', border: '1px solid rgba(248,113,113,0.5)', color: '#f87171', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {pedido.peso_real_kg && (
                  <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '12px 14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#4ade80', fontSize: 13, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Scale size={14} /> Peso registrado
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: D.muted }}>Cantidad:</span>
                        <span style={{ fontWeight: 600, color: D.text }}>{pedido.cantidad_pescados} pescados</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: D.muted }}>Peso total:</span>
                        <span style={{ fontWeight: 600, color: D.text }}>{pedido.peso_real_kg} kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(74,222,128,0.2)', marginTop: 4 }}>
                        <span style={{ fontWeight: 700, color: D.text }}>Precio final:</span>
                        <span style={{ fontWeight: 900, color: '#4ade80', fontSize: 18 }}>Bs. {parseFloat(pedido.precio_final || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {pedido.estado === 'esperando_confirmacion' && (
                  <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Hourglass size={14} style={{ color: '#fb923c', flexShrink: 0, animation: 'spin 2s linear infinite' }} />
                    <p style={{ fontSize: 13, color: '#fb923c', margin: 0 }}>Esperando que el consumidor confirme el precio</p>
                  </div>
                )}
                <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: D.muted }}>Método de envío:</span>
                    <span style={{ fontWeight: 600, color: D.text }}>{pedido.metodoEnvio || 'Domicilio'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${D.border}`, marginTop: 2 }}>
                    <span style={{ fontWeight: 700, color: D.text }}>Total</span>
                    <span style={{ fontWeight: 800, color: D.text, fontSize: 16 }}>Bs. {parseFloat(pedido.precio_final || pedido.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {pedido.estado === 'preparando' && (
                  <button onClick={() => onPesar(pedido)}
                    style={{ width: '100%', padding: '10px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Scale size={16} /> ⚖️ Registrar peso y calcular precio
                  </button>
                )}
                {action && pedido.estado === 'pendiente' && pedido.comprobante_url && (
                  <button onClick={() => onConfirmar(pedido.id, action.next)}
                    style={{ width: '100%', padding: '10px 0', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    ✅ Confirmar pago y aceptar pedido
                  </button>
                )}
                {action && !(pedido.estado === 'pendiente' && pedido.comprobante_url) && (
                  <button onClick={() => onConfirmar(pedido.id, action.next)}
                    style={{ width: '100%', padding: '10px 0', background: action.bg, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {action.label}
                  </button>
                )}
                {!['entregado', 'cancelado'].includes(pedido.estado) && (
                  <button onClick={() => onConfirmar(pedido.id, 'cancelado')}
                    style={{ width: '100%', padding: '8px 0', background: 'none', border: `1px solid rgba(248,113,113,0.4)`, borderRadius: 10, color: '#f87171', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <XCircle size={14} /> Cancelar pedido
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
const Pedidos = () => {
  const { D } = useTheme()
  const [refreshing,   setRefreshing]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sortBy,       setSortBy]       = useState('fecha-desc')
  const [pedidoParaPesar, setPedidoParaPesar] = useState(null)

  const qc = useQueryClient()

  const { data: pedidos = [], isLoading: loading, refetch } = useQuery({
    queryKey: PEDIDOS_REC_QK,
    queryFn: async () => {
      const res  = await api.get(API_ENDPOINTS.PEDIDOS.RECIBIDOS)
      const data = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)        ? res.data : []
      return data.map(p => ({
        id: p.id, numero: `PED-${p.id}`,
        fecha: p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-ES') : '—',
        estado: p.estado || 'pendiente', total: Number(p.total) || 0,
        codigo_retiro: p.codigo_retiro || null,
        cantidad_pescados: p.cantidad_pescados || null, peso_real_kg: p.peso_real_kg || null,
        precio_final: p.precio_final || null, confirmacion_expires_at: p.confirmacion_expires_at || null,
        rawData: p,
        cliente: { nombre: p.consumidor || 'Cliente', telefono: p.telefono || null, direccion: p.direccion || 'No especificada' },
        metodoEnvio: p.metodo_envio || 'Domicilio', notas: p.notas || null,
      }))
    },
    refetchInterval: 30000,
  })

  const fetchPedidos = async (silencioso = false) => {
    if (!silencioso) return
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleConfirmar = async (pedidoId, nuevoEstado) => {
    try {
      await api.put(API_ENDPOINTS.PEDIDOS.ESTADO(pedidoId), { nuevoEstado })
      qc.setQueryData(PEDIDOS_REC_QK, (old = []) =>
        old.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p)
      )
    } catch (err) { console.error('Error al actualizar pedido:', err) }
  }

  const filtered = pedidos
    .filter(p => {
      if (statusFilter !== 'todos' && p.estado !== statusFilter) return false
      if (searchQuery) { const q = searchQuery.toLowerCase(); return p.numero.toLowerCase().includes(q) || p.cliente.nombre.toLowerCase().includes(q) }
      return true
    })
    .sort((a, b) => {
      if (a.estado === 'esperando_confirmacion' && b.estado !== 'esperando_confirmacion') return -1
      if (b.estado === 'esperando_confirmacion' && a.estado !== 'esperando_confirmacion') return 1
      if (sortBy === 'fecha-desc') return new Date(b.fecha.split('/').reverse().join('-')) - new Date(a.fecha.split('/').reverse().join('-'))
      if (sortBy === 'fecha-asc')  return new Date(a.fecha.split('/').reverse().join('-')) - new Date(b.fecha.split('/').reverse().join('-'))
      if (sortBy === 'total-desc') return (b.precio_final || b.total) - (a.precio_final || a.total)
      if (sortBy === 'total-asc')  return (a.precio_final || a.total) - (b.precio_final || b.total)
      return 0
    })

  const counts = {
    pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
    confirmado: pedidos.filter(p => p.estado === 'confirmado').length,
    preparando: pedidos.filter(p => p.estado === 'preparando').length,
    esperando_confirmacion: pedidos.filter(p => p.estado === 'esperando_confirmacion').length,
    en_camino: pedidos.filter(p => p.estado === 'en_camino').length,
    entregado: pedidos.filter(p => p.estado === 'entregado').length,
    cancelado: pedidos.filter(p => p.estado === 'cancelado').length,
  }

  const statCards = [
    { label: 'Pendientes',        value: counts.pendiente,              hex: '#f59e0b', icon: Clock        },
    { label: 'Confirmados',       value: counts.confirmado,             hex: '#38bdf8', icon: CheckCircle  },
    { label: 'Preparando',        value: counts.preparando,             hex: '#a855f7', icon: Package      },
    { label: 'Esp. conf.',        value: counts.esperando_confirmacion, hex: '#fb923c', icon: Hourglass    },
    { label: 'En camino',         value: counts.en_camino,             hex: '#14b8a6', icon: Truck        },
    { label: 'Entregados',        value: counts.entregado,             hex: '#22c55e', icon: CheckCircle  },
    { label: 'Cancelados',        value: counts.cancelado,             hex: '#ef4444', icon: XCircle      },
  ]

  const selectSt = { padding: '8px 12px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, outline: 'none', colorScheme: 'dark' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: D.bg }}>
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Gestión de Pedidos</h1>
            <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>
              Administra y da seguimiento a los pedidos de tus clientes
              {counts.esperando_confirmacion > 0 && (
                <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: 'rgba(251,146,60,0.15)', color: '#fb923c', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  ⏳ {counts.esperando_confirmacion} esperando confirmación
                </span>
              )}
            </p>
          </div>
          <button onClick={() => fetchPedidos(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
          {statCards.map(({ label, value, hex, icon: Icon }) => (
            <div key={label} className="np-hover" onClick={() => setStatusFilter(Object.keys(ORDER_STATES).find(k => ORDER_STATES[k].label === label || ORDER_STATES[k].label.startsWith(label.split(' ')[0])) || 'todos')}
              style={{ background: D.card, borderRadius: 12, borderLeft: `4px solid ${hex}`, border: `1px solid ${D.border}`, borderLeftWidth: 4, padding: '12px 14px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={16} style={{ color: hex, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, color: D.muted, margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: hex, margin: 0 }}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: D.muted, pointerEvents: 'none' }} />
            <input type="text" placeholder="Buscar por número o cliente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ ...selectSt, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectSt}>
            <option value="todos">Todos los estados</option>
            {Object.entries(ORDER_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectSt}>
            <option value="fecha-desc">Más recientes</option>
            <option value="fecha-asc">Más antiguos</option>
            <option value="total-desc">Mayor importe</option>
            <option value="total-asc">Menor importe</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: D.card, borderRadius: 14, height: 64, border: `1px solid ${D.border}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(pedido => (
            <PedidoRow key={pedido.id} pedido={pedido} onConfirmar={handleConfirmar} onPesar={setPedidoParaPesar} onRefresh={() => fetchPedidos(true)} />
          ))
        ) : (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
            <Package size={56} style={{ color: D.dim, margin: '0 auto 12px', opacity: 0.4 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 6 }}>No se encontraron pedidos</h3>
            <p style={{ color: D.muted, fontSize: 14, marginBottom: 16 }}>Prueba con otros filtros</p>
            <button onClick={() => { setSearchQuery(''); setStatusFilter('todos') }}
              style={{ padding: '8px 20px', background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {pedidoParaPesar && (
        <ModalRegistrarPeso pedido={pedidoParaPesar} onClose={() => setPedidoParaPesar(null)} onSuccess={() => fetchPedidos(true)} />
      )}
    </div>
  )
}

export default Pedidos
