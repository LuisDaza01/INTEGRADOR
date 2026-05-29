"use client"
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axiosInstance from '../../api/config/axios'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import UserMenu from '../../components/layout/UserMenu'
import {
  Bike, MapPin, Package, CheckCircle, Clock, RefreshCw, Key, LogOut,
  History, AlertCircle, TrendingUp, Calendar, Navigation, Phone, X,
} from 'lucide-react'

const POLLING = 15000

const STATUS_COLOR = {
  listo_para_recoger: '#F59E0B',
  en_camino:          '#22C55E',
  entregado:          '#16a34a',
  preparando:         '#8B5CF6',
  confirmado:         '#4ade80',
  pendiente:          '#9CA3AF',
}
const STATUS_LABEL = {
  pendiente:          'Pendiente',
  confirmado:         'Confirmado',
  preparando:         'Preparando',
  listo_para_recoger: 'Listo para recoger',
  en_camino:          'En camino',
  entregado:          'Entregado',
}

const formatFecha = (f) =>
  f ? new Date(f).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

// ── Modal genérico con estilo glass + neón ─────────────────────────────────
const ConfirmModal = ({ open, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false, onConfirm, onCancel, D }) => {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'rgba(10,15,30,0.98)', border: `1px solid ${danger ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius: 18, padding: 28, maxWidth: 380, width: '100%',
            boxShadow: `0 0 40px ${danger ? 'rgba(248,113,113,0.15)' : 'rgba(34,197,94,0.15)'}`,
          }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: danger ? 'rgba(248,113,113,0.12)' : 'rgba(34,197,94,0.12)',
              border: `1px solid ${danger ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              {danger ? <LogOut size={22} color="#f87171" /> : <CheckCircle size={22} color="#22C55E" />}
            </div>
            <h4 style={{ color: D.text, margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>{title}</h4>
            <p style={{ color: D.muted, fontSize: 13, margin: '0 0 22px', lineHeight: 1.5 }}>{message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${D.border}`,
                background: 'rgba(34,197,94,0.06)', color: D.text, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>{cancelText}</button>
              <button onClick={onConfirm} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                background: danger ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#16a34a,#22C55E)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>{confirmText}</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Toast de feedback ──────────────────────────────────────────────────────
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onClose, 3500)
    return () => clearTimeout(id)
  }, [message, onClose])
  if (!message) return null
  const isError = type === 'error'
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 90,
        padding: '12px 18px', borderRadius: 12,
        background: isError ? 'rgba(127,29,29,0.95)' : 'rgba(20,83,45,0.95)',
        border: `1px solid ${isError ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.4)'}`,
        color: '#fff', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: `0 8px 24px ${isError ? 'rgba(127,29,29,0.4)' : 'rgba(20,83,45,0.4)'}`,
        backdropFilter: 'blur(10px)',
      }}>
      {isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
      {message}
    </motion.div>
  )
}

// ── KPI card ───────────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, color, D }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    style={{
      flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: 14,
      background: `linear-gradient(135deg, ${color}14, ${color}06)`,
      border: `1px solid ${color}30`,
      boxShadow: `inset 0 1px 0 ${color}10`,
    }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
  </motion.div>
)

export default function DashboardRepartidor() {
  const { user, logout } = useAuth()
  const { D } = useTheme()

  const [tab,              setTab]              = useState('disponibles')
  const [pedidos,          setPedidos]          = useState([])
  const [historial,        setHistorial]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [codigo,           setCodigo]           = useState('')
  const [enviandoCodigo,   setEnviandoCodigo]   = useState(false)
  const [toast,            setToast]            = useState({ type: null, message: null })
  const [logoutModalOpen,  setLogoutModalOpen]  = useState(false)
  const [entregaModal,     setEntregaModal]     = useState(null) // pedido o null
  // Pedido pendiente de elegir ETA antes de hacer el POST de recogida
  const [etaModal,         setEtaModal]         = useState(null) // { pedido, codigoLimpio } | null
  const [etaCustom,        setEtaCustom]        = useState('')
  const pollingRef = useRef(null)

  const showToast = (type, message) => setToast({ type, message })
  const clearToast = () => setToast({ type: null, message: null })

  const cargarPedidos = async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    try {
      const res = await axiosInstance.get('/repartidor/pedidos-disponibles')
      const lista = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setPedidos(lista)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  const cargarHistorial = async () => {
    setLoadingHistorial(true)
    try {
      const res = await axiosInstance.get('/repartidor/mis-pedidos')
      const lista = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setHistorial(lista)
    } catch { /* silent */ } finally {
      setLoadingHistorial(false)
    }
  }

  useEffect(() => {
    cargarPedidos()
    cargarHistorial()
    pollingRef.current = setInterval(() => cargarPedidos(true), POLLING)
    return () => clearInterval(pollingRef.current)
  }, [])

  useEffect(() => {
    if (tab === 'historial') cargarHistorial()
  }, [tab])

  const confirmarCodigo = () => {
    const limpio = codigo.toUpperCase().trim()
    if (limpio.length < 4) return
    const pedido = pedidos.find(p => p.codigo_retiro === limpio)
    if (!pedido) { showToast('error', 'Código no encontrado. Verifica que el pedido esté listo para recoger.'); return }
    // En lugar de hacer el POST aquí, abrir el modal de ETA.
    setEtaModal({ pedido, codigoLimpio: limpio })
  }

  const enviarRecogidaConETA = async (etaMinutos) => {
    if (!etaModal) return
    const { pedido, codigoLimpio } = etaModal
    setEnviandoCodigo(true)
    try {
      const res = await axiosInstance.post(`/repartidor/pedidos/${pedido.id}/recoger`, {
        codigo_retiro: codigoLimpio,
        eta_minutos: etaMinutos || null,
      })
      setCodigo('')
      setEtaModal(null)
      setEtaCustom('')
      showToast('success', res.data?.message || '¡Pedido recogido! El consumidor fue notificado.')
      cargarPedidos(true)
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error al confirmar el código')
    } finally {
      setEnviandoCodigo(false)
    }
  }

  const marcarEntregado = async (pedidoId) => {
    setEntregaModal(null)
    try {
      await axiosInstance.post(`/repartidor/pedidos/${pedidoId}/entregar`, {})
      showToast('success', 'Entrega confirmada')
      cargarPedidos(true)
      cargarHistorial()
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error al marcar entregado')
    }
  }

  const abrirEnMaps = (pedido) => {
    const query = encodeURIComponent(`${pedido.entrega_direccion}, ${pedido.entrega_ciudad}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener')
  }

  const pedidosActivos = pedidos.filter(p => p.estado === 'en_camino')
  const ordenados = [...pedidos].sort((a, b) => {
    const orden = { en_camino: 0, listo_para_recoger: 1, confirmado: 2, preparando: 3, pendiente: 4 }
    return (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9)
  })

  // ── KPIs computados del historial ──
  const kpis = useMemo(() => {
    const ahora = new Date()
    const inicioDia    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const inicioSemana = new Date(inicioDia); inicioSemana.setDate(inicioDia.getDate() - 6)
    let hoy = 0, semana = 0, total = 0
    for (const p of historial) {
      const f = new Date(p.fecha_pedido)
      if (Number.isNaN(f.getTime())) continue
      total++
      if (f >= inicioDia)    hoy++
      if (f >= inicioSemana) semana++
    }
    return { hoy, semana, total }
  }, [historial])

  const iniciales = (user?.nombre || 'R').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: D.bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Orbs ambientales */}
      <div style={{ position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.10), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: -100, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.07), transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Header glassmorphism ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: `1px solid rgba(34,197,94,0.15)`,
      }}>
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 1, background: 'linear-gradient(90deg, transparent, #22C55E, transparent)' }} />

        {/* Identidad del panel */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #16a34a, #22C55E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(34,197,94,0.35)',
        }}>
          <Bike size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, color: D.text, fontSize: 15 }}>Panel de Entregas</p>
          <p style={{ margin: 0, fontSize: 11, color: D.muted, marginTop: 2 }}>Repartidor — NaturaPiscis</p>
        </div>

        {pedidosActivos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.12)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.3)' }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{pedidosActivos.length} en camino</span>
          </div>
        )}

        {/* User menu (avatar + cerrar sesión) */}
        <UserMenu role="repartidor" showLabel={false} />
      </header>

      <main style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

        {/* ── KPIs ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <KPICard icon={Calendar}    label="Hoy"       value={kpis.hoy}    color="#22C55E" D={D} />
          <KPICard icon={TrendingUp}  label="Semana"    value={kpis.semana} color="#4ade80" D={D} />
          <KPICard icon={CheckCircle} label="Total"     value={kpis.total}  color="#22C55E" D={D} />
        </div>

        {/* ── Código de retiro ── */}
        <div style={{
          background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)',
          border: `1px solid rgba(34,197,94,0.18)`, borderRadius: 16, padding: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Key size={18} color="#22C55E" />
            <p style={{ margin: 0, fontWeight: 700, color: D.text, fontSize: 15 }}>Ingresar código del paquete</p>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: D.muted }}>Ingresa los 6 dígitos del código del paquete</p>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && confirmarCodigo()}
              placeholder="000000"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 10,
                border: `2px solid ${codigo.length >= 6 ? '#22C55E' : 'rgba(34,197,94,0.2)'}`,
                background: 'rgba(10,15,30,0.5)', color: D.text,
                fontSize: 24, fontWeight: 800, letterSpacing: 8, textAlign: 'center', outline: 'none',
                boxShadow: codigo.length >= 6 ? '0 0 14px rgba(34,197,94,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            />
            <button
              onClick={confirmarCodigo}
              disabled={enviandoCodigo || codigo.trim().length < 4}
              style={{
                padding: '12px 22px', borderRadius: 10,
                background: codigo.trim().length >= 4 ? 'linear-gradient(135deg,#16a34a,#22C55E)' : 'rgba(100,116,139,0.3)',
                color: '#fff', fontWeight: 700, border: 'none',
                cursor: codigo.trim().length >= 4 ? 'pointer' : 'not-allowed',
                fontSize: 14, opacity: enviandoCodigo ? 0.7 : 1,
                boxShadow: codigo.trim().length >= 4 ? '0 4px 16px rgba(34,197,94,0.35)' : 'none',
              }}>
              {enviandoCodigo ? '...' : 'Confirmar'}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'disponibles', label: `Disponibles${pedidos.length ? ` (${pedidos.length})` : ''}`, Icon: Package },
            { key: 'historial',   label: 'Historial', Icon: History  },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: tab === key ? 'none' : `1px solid ${D.border}`,
                background: tab === key ? 'linear-gradient(135deg,#16a34a,#22C55E)' : 'rgba(15,23,42,0.5)',
                color: tab === key ? '#fff' : D.text,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: tab === key ? '0 4px 14px rgba(34,197,94,0.3)' : 'none',
              }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── DISPONIBLES ── */}
        {tab === 'disponibles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: D.muted, fontSize: 14 }}>Cargando pedidos...</div>
            ) : ordenados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: 'rgba(15,23,42,0.5)', border: `1px solid ${D.border}`, borderRadius: 14 }}>
                <CheckCircle size={40} color={D.dim} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>No hay pedidos disponibles por ahora</p>
              </div>
            ) : (
              ordenados.map(pedido => {
                const sc = STATUS_COLOR[pedido.estado] || '#9CA3AF'
                const enCamino = pedido.estado === 'en_camino'
                return (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)',
                      border: `1px solid ${enCamino ? 'rgba(34,197,94,0.4)' : D.border}`,
                      borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                      boxShadow: enCamino ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700, color: D.text, fontSize: 15 }}>Pedido #{pedido.id}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc + '20', color: sc, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          {STATUS_LABEL[pedido.estado] || pedido.estado}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#22C55E' }}>Bs. {parseFloat(pedido.total || 0).toFixed(2)}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', alignSelf: 'flex-start' }}>
                      <Key size={13} color="#22C55E" />
                      <span style={{ fontWeight: 800, color: '#22C55E', fontSize: 14, letterSpacing: 2 }}>{pedido.codigo_retiro}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                        <MapPin size={14} color={D.muted} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: D.muted, flex: 1 }}>{pedido.entrega_direccion}, {pedido.entrega_ciudad}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: D.muted }}>👤 {pedido.consumidor_nombre}</span>
                        {pedido.consumidor_telefono && (
                          <a href={`tel:${pedido.consumidor_telefono}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ade80', textDecoration: 'none', padding: '2px 8px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
                            <Phone size={11} /> {pedido.consumidor_telefono}
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Clock size={13} color={D.dim} />
                        <span style={{ fontSize: 12, color: D.dim }}>{pedido.total_items} producto(s) · {formatFecha(pedido.fecha_pedido)}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => abrirEnMaps(pedido)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        <Navigation size={14} /> Abrir en Maps
                      </button>
                      {enCamino && (
                        <button onClick={() => setEntregaModal(pedido)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#22C55E)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
                          <CheckCircle size={15} /> Marcar entregado
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: D.dim, fontSize: 12 }}>
              <RefreshCw size={11} /> Se actualiza cada 15 segundos
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab === 'historial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingHistorial ? (
              <div style={{ textAlign: 'center', padding: 40, color: D.muted, fontSize: 14 }}>Cargando historial...</div>
            ) : historial.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: 'rgba(15,23,42,0.5)', border: `1px solid ${D.border}`, borderRadius: 14 }}>
                <History size={36} color={D.dim} style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ color: D.muted, margin: 0, fontSize: 14 }}>Aún no tienes entregas completadas</p>
              </div>
            ) : (
              historial.map(pedido => (
                <motion.div key={pedido.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: 'rgba(15,23,42,0.5)', border: `1px solid ${D.border}`, borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, color: D.text, fontSize: 14 }}>Pedido #{pedido.id}</p>
                    <p style={{ margin: '0 0 2px', fontSize: 13, color: D.muted }}>{pedido.consumidor_nombre}</p>
                    <p style={{ margin: 0, fontSize: 11, color: D.dim }}>{formatFecha(pedido.fecha_pedido)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#22C55E', fontSize: 15 }}>Bs. {parseFloat(pedido.total || 0).toFixed(2)}</p>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontWeight: 700, border: '1px solid rgba(34,197,94,0.25)' }}>Entregado</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modales y toasts (logout ahora lo maneja UserMenu) */}
      <ConfirmModal
        open={!!entregaModal}
        title="Confirmar entrega"
        message={entregaModal ? `¿Entregaste el pedido #${entregaModal.id} a ${entregaModal.consumidor_nombre}?` : ''}
        confirmText="Sí, entregué"
        cancelText="Cancelar"
        onCancel={() => setEntregaModal(null)}
        onConfirm={() => entregaModal && marcarEntregado(entregaModal.id)}
        D={D}
      />

      {/* ── Modal: ETA tras confirmar código ── */}
      <AnimatePresence>
        {etaModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !enviandoCodigo && setEtaModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 18, padding: 26, maxWidth: 400, width: '100%', boxShadow: '0 0 40px rgba(34,197,94,0.15)' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Clock size={22} color="#22C55E" />
                </div>
                <h4 style={{ color: D.text, margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>¿En cuánto llegas a la parada?</h4>
                <p style={{ color: D.muted, fontSize: 12, margin: 0 }}>El consumidor recibirá la hora aproximada</p>
              </div>

              {/* Presets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: '2 h',    mins: 120 },
                  { label: '2 h 30', mins: 150 },
                  { label: '3 h',    mins: 180 },
                  { label: '3 h 30', mins: 210 },
                ].map(p => (
                  <button key={p.mins}
                    onClick={() => enviarRecogidaConETA(p.mins)}
                    disabled={enviandoCodigo}
                    style={{ padding: '14px 0', borderRadius: 12, border: '1.5px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: 15, fontWeight: 700, cursor: enviandoCodigo ? 'not-allowed' : 'pointer', opacity: enviandoCodigo ? 0.5 : 1 }}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom */}
              <p style={{ fontSize: 12, color: D.muted, margin: '0 0 6px' }}>Otro tiempo (en minutos):</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={etaCustom} onChange={e => setEtaCustom(e.target.value.replace(/\D/g, ''))}
                  placeholder="ej. 90" type="number" min={1} max={1440}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'rgba(10,15,30,0.5)', color: D.text, fontSize: 14, outline: 'none' }} />
                <button
                  onClick={() => {
                    const m = parseInt(etaCustom, 10)
                    if (Number.isFinite(m) && m > 0 && m <= 1440) enviarRecogidaConETA(m)
                    else showToast('error', 'Minutos entre 1 y 1440')
                  }}
                  disabled={enviandoCodigo || !etaCustom}
                  style={{ padding: '0 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#16a34a,#22C55E)', color: '#fff', fontWeight: 700, cursor: (enviandoCodigo || !etaCustom) ? 'not-allowed' : 'pointer', opacity: (enviandoCodigo || !etaCustom) ? 0.5 : 1 }}>
                  OK
                </button>
              </div>

              {/* Cancelar / sin ETA */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEtaModal(null)} disabled={enviandoCodigo}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${D.border}`, background: 'rgba(34,197,94,0.04)', color: D.text, fontWeight: 600, fontSize: 13, cursor: enviandoCodigo ? 'not-allowed' : 'pointer', opacity: enviandoCodigo ? 0.5 : 1 }}>Cancelar</button>
                <button onClick={() => enviarRecogidaConETA(null)} disabled={enviandoCodigo}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.muted, fontWeight: 600, fontSize: 13, cursor: enviandoCodigo ? 'not-allowed' : 'pointer', opacity: enviandoCodigo ? 0.5 : 1 }}>Sin ETA</button>
              </div>

              {enviandoCodigo && (
                <p style={{ textAlign: 'center', color: D.muted, fontSize: 12, marginTop: 12 }}>Enviando…</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.message && <Toast type={toast.type} message={toast.message} onClose={clearToast} />}
      </AnimatePresence>
    </div>
  )
}
