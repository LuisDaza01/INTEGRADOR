"use client"
import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ClipboardList, Search, Filter, ChevronDown, ChevronRight,
  Package, Truck, CheckCircle, Clock, Calendar, Download,
  Eye, MessageSquare, Navigation, Scale, Timer, CheckCircle2,
  XCircle, AlertTriangle,
} from "lucide-react"
import api from "../../api/config/axios"
import { API_ENDPOINTS } from '../../config/apiConfig'
import { useTheme } from "../../contexts/ThemeContext"
import { SkeletonTableRow, SkeletonList } from '../../components/ui/Skeleton'

// ── Countdown hook ────────────────────────────────────────────
const useCountdown = (expiresAt) => {
  const [segs, setSegs] = useState(0)

  useEffect(() => {
    if (!expiresAt) return
    const calcular = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000))
      setSegs(diff)
    }
    calcular()
    const interval = setInterval(calcular, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const minutos  = Math.floor(segs / 60)
  const segundos = segs % 60
  return { minutos, segundos, expirado: segs === 0, urgente: minutos < 15 && segs > 0 }
}

// ── Card confirmación de precio ───────────────────────────────
const CardConfirmarPrecio = ({ order, onConfirmar, onRechazar, cargando }) => {
  const { D } = useTheme()
  const { minutos, segundos, expirado, urgente } = useCountdown(order.rawData?.confirmacion_expires_at)
  const accentColor = expirado ? D.red : urgente ? D.orange : D.green

  return (
    <div style={{ borderRadius: 14, border: `2px solid ${accentColor}`, background: `${accentColor}0d`, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Scale style={{ color: accentColor }} size={18} />
        <span style={{ fontWeight: 700, fontSize: 14, color: expirado ? D.red : D.text }}>
          {expirado ? 'Tiempo expirado — pedido cancelado' : '⚖️ ¡Tu pedido fue pesado!'}
        </span>
      </div>

      <div style={{ background: D.surface, borderRadius: 10, padding: 14, border: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Pescados pesados', val: `${order.rawData?.cantidad_pescados ?? '—'} unidades` },
          { label: 'Peso total', val: `${order.rawData?.peso_real_kg ?? '—'} kg` },
          { label: 'Precio por kg', val: 'Bs. 35/kg' },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: D.muted }}>{label}</span>
            <span style={{ fontWeight: 600, color: D.text }}>{val}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: D.text }}>💰 Total a pagar</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: D.green }}>
            Bs. {parseFloat(order.rawData?.precio_final || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {!expirado ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: urgente ? `${D.orange}15` : `${D.green}15`, color: urgente ? D.orange : D.green, fontSize: 13, fontWeight: 600 }}>
          <Timer size={15} />
          Tienes {minutos}:{segundos.toString().padStart(2, '0')} min para confirmar
          {urgente && <AlertTriangle size={15} style={{ marginLeft: 'auto' }} />}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: `${D.red}15`, color: D.red, fontSize: 13, fontWeight: 600 }}>
          <XCircle size={15} />
          El tiempo expiró — el pedido fue cancelado automáticamente
        </div>
      )}

      {!expirado && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onRechazar(order.rawId)} disabled={cargando}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: `1px solid ${D.red}50`, color: D.red, background: `${D.red}0d`, cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: cargando ? 0.5 : 1 }}>
            <XCircle size={15} /> Rechazar
          </button>
          <button onClick={() => onConfirmar(order.rawId)} disabled={cargando}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,#22c55e,#16a34a)`, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: cargando ? 0.5 : 1 }}>
            {cargando
              ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              : <CheckCircle2 size={15} />}
            Aceptar precio
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
const MisPedidos = () => {
  const navigate = useNavigate()
  const { D } = useTheme()
  const [searchQuery, setSearchQuery]     = useState("")
  const [statusFilter, setStatusFilter]   = useState("todos")
  const [dateFilter, setDateFilter]       = useState("todos")
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [cargandoPrecio, setCargandoPrecio] = useState(false)

  const qc = useQueryClient()

  const mapPedido = (pedido) => ({
    id:      `PED-${pedido.id}`,
    rawId:   pedido.id,
    rawData: pedido,
    date:    new Date(pedido.fecha_pedido).toLocaleDateString("es-BO"),
    status:  pedido.estado,
    total:   parseFloat(pedido.precio_final || pedido.total || 0),
    items: Array.isArray(pedido.items) ? pedido.items.map(item => ({
      id:       item.producto_id,
      name:     item.nombre || 'Producto',
      quantity: item.cantidad,
      price:    parseFloat(item.precio_unitario || 0),
      image:    item.imagen || "/placeholder.svg",
    })) : [],
    shipping: {
      method:  pedido.metodo_envio || "Entrega a domicilio",
      address: "Ver detalles",
      cost:    parseFloat(pedido.costo_envio || 5.0),
    },
  })

  const PEDIDOS_QK = ['pedidos', 'mis-pedidos']

  const { data: orders = [], isLoading: loading, refetch: fetchPedidos } = useQuery({
    queryKey: PEDIDOS_QK,
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PEDIDOS.BASE)
      const data = res.data.data || res.data || []
      return (Array.isArray(data) ? data : []).map(mapPedido)
    },
    refetchInterval: 15000,
  })

  // ── Confirmar precio ─────────────────────────────────────────
  const handleConfirmar = async (pedidoId) => {
    setCargandoPrecio(true)
    try {
      await api.post(`${API_ENDPOINTS.PEDIDOS.BASE}/${pedidoId}/confirmar-precio`, {})
      await fetchPedidos()
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo confirmar el precio')
    } finally {
      setCargandoPrecio(false)
    }
  }

  // ── Rechazar precio ──────────────────────────────────────────
  const handleRechazar = async (pedidoId) => {
    if (!window.confirm('¿Estás seguro de rechazar el precio? El pedido se cancelará.')) return
    setCargandoPrecio(true)
    try {
      await api.post(`${API_ENDPOINTS.PEDIDOS.BASE}/${pedidoId}/rechazar-precio`, {})
      await fetchPedidos()
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo rechazar el precio')
    } finally {
      setCargandoPrecio(false)
    }
  }

  const puedeVerTracking = (status) =>
    ['confirmado', 'preparando', 'listo_para_recoger', 'en_camino'].includes(status)

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "todos" && order.status !== statusFilter) return false
    if (dateFilter === "ultimo-mes") {
      const hace30dias = new Date()
      hace30dias.setDate(hace30dias.getDate() - 30)
      const fechaPedido = new Date(order.date.split('/').reverse().join('-'))
      if (fechaPedido < hace30dias) return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.id.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query))
      )
    }
    return true
  })

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden:  { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "entregado":              return <CheckCircle size={20} style={{ color: D.green }} />
      case "en_camino":              return <Truck size={20} style={{ color: D.primary }} />
      case "esperando_confirmacion": return <Scale size={20} style={{ color: D.orange }} />
      case "pesado":                 return <Scale size={20} style={{ color: D.primary }} />
      case "preparando": case "confirmado": case "listo_para_recoger":
        return <Package size={20} style={{ color: D.primary }} />
      case "pendiente":              return <Clock size={20} style={{ color: D.orange }} />
      default:                       return <ClipboardList size={20} style={{ color: D.muted }} />
    }
  }

  const getStatusStyle = (status) => {
    const map = {
      entregado:              { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E',  border: 'rgba(34,197,94,0.3)' },
      en_camino:              { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80',  border: 'rgba(74,222,128,0.3)' },
      esperando_confirmacion: { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c',  border: 'rgba(251,146,60,0.3)' },
      pesado:                 { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E',  border: 'rgba(34,197,94,0.3)' },
      preparando:             { bg: 'rgba(34,197,94,0.10)',   color: '#4ade80',  border: 'rgba(34,197,94,0.28)' },
      confirmado:             { bg: 'rgba(34,197,94,0.10)',   color: '#4ade80',  border: 'rgba(34,197,94,0.28)' },
      listo_para_recoger:     { bg: 'rgba(34,197,94,0.10)',   color: '#4ade80',  border: 'rgba(34,197,94,0.28)' },
      pendiente:              { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24',  border: 'rgba(251,191,36,0.3)' },
      cancelado:              { bg: 'rgba(248,113,113,0.12)', color: '#f87171',  border: 'rgba(248,113,113,0.3)' },
    }
    return map[status] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.3)' }
  }
  const getStatusColor = (status) => {
    const { bg, color, border } = getStatusStyle(status)
    return { background: bg, color, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }
  }

  const getStatusLabel = (status) => {
    const labels = {
      pendiente:              'Pendiente',
      confirmado:             'Confirmado',
      preparando:             'En preparación',
      pesado:                 'Pesado',
      esperando_confirmacion: 'Confirmar precio',
      listo_para_recoger:     'Listo para recoger',
      en_camino:              'En camino',
      entregado:              'Entregado',
      cancelado:              'Cancelado',
    }
    return labels[status] || status.replace(/_/g, ' ')
  }

  const selStyle = { background: D.surface, border: `1px solid ${D.border}`, color: D.text, colorScheme: 'dark', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none' }

  return (
    <motion.div style={{ padding: 24, minHeight: '100vh', background: D.bg }} initial="hidden" animate="visible" variants={containerVariants}>
      {/* Title */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Mis Pedidos</h1>
          <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Historial y seguimiento de tus compras</p>
        </div>
        <button style={{ padding: 8, borderRadius: 10, background: D.card, border: `1px solid ${D.border}`, cursor: 'pointer', color: D.muted }}>
          <Download size={18} />
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: D.primary, pointerEvents: 'none' }} size={15} />
              <input type="text" placeholder="Buscar pedido..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'rgba(34,197,94,0.05)', border: `1px solid ${D.border}`, borderRadius: 10, color: D.text, fontSize: 13, outline: 'none', width: 200 }}
                onFocus={e => e.target.style.borderColor = D.primary}
                onBlur={e => e.target.style.borderColor = D.border}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="preparando">En preparación</option>
              <option value="pesado">Pesado</option>
              <option value="esperando_confirmacion">Confirmar precio</option>
              <option value="listo_para_recoger">Listo para recoger</option>
              <option value="en_camino">En camino</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={selStyle}>
              <option value="todos">Todas las fechas</option>
              <option value="ultimo-mes">Último mes</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SkeletonList count={5} Component={SkeletonTableRow} />
        </div>
      ) : (
        <>
          {filteredOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredOrders.map(order => (
                <motion.div key={order.id} variants={itemVariants}
                  style={{ background: D.card, border: `1px solid ${order.status === 'esperando_confirmacion' ? D.orange : D.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: order.status === 'esperando_confirmacion' ? `0 0 16px ${D.orange}30` : 'none' }}>
                  {/* Header */}
                  <div style={{ padding: 16, cursor: 'pointer' }}
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: getStatusStyle(order.status).bg, flexShrink: 0 }}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: '0 0 2px' }}>{order.id}</h3>
                          <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>
                            {order.date} · {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {order.status === 'esperando_confirmacion' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: `${D.orange}15`, color: D.orange, fontSize: 11, fontWeight: 700, borderRadius: 20, animation: 'pulse 2s infinite' }}>
                            <Timer size={11} /> Acción requerida
                          </span>
                        )}
                        {puedeVerTracking(order.status) && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={e => { e.stopPropagation(); navigate(`/dashboard-consumidor/tracking/${order.rawId}`) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            <Navigation size={13} />
                            {order.status === 'en_camino' ? 'En vivo' : 'Seguir'}
                          </motion.button>
                        )}
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Bs. {order.total.toFixed(2)}</p>
                          <span style={getStatusColor(order.status)}>{getStatusLabel(order.status)}</span>
                        </div>
                        <ChevronRight style={{ color: D.muted, transform: expandedOrder === order.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Confirm price card */}
                  {order.status === 'esperando_confirmacion' && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <CardConfirmarPrecio order={order} onConfirmar={handleConfirmar} onRechazar={handleRechazar} cargando={cargandoPrecio} />
                    </div>
                  )}

                  {/* Expanded detail */}
                  {expandedOrder === order.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                      style={{ borderTop: `1px solid ${D.border}` }}>
                      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: D.text, marginBottom: 14 }}>Productos</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {order.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={item.image || "/placeholder.svg"} alt={item.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, border: `1px solid ${D.border}` }} />
                                <div>
                                  <h5 style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: '0 0 2px' }}>{item.name}</h5>
                                  <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>{item.quantity} pescados</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: D.text, marginBottom: 14 }}>Resumen</h4>
                          <div style={{ background: D.surface, borderRadius: 12, padding: 14, border: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {order.rawData?.peso_real_kg ? (
                              <>
                                {[['Pescados', `${order.rawData.cantidad_pescados} unidades`], ['Peso', `${order.rawData.peso_real_kg} kg`], ['Precio/kg', 'Bs. 35']].map(([l, v]) => (
                                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: D.muted }}>{l}</span>
                                    <span style={{ fontWeight: 600, color: D.text }}>{v}</span>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: D.muted }}>Envío</span>
                                <span style={{ fontWeight: 600, color: D.text }}>Bs. {order.shipping.cost.toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, color: D.text }}>
                              <span>Total</span>
                              <span style={{ color: D.primary }}>Bs. {order.total.toFixed(2)}</span>
                            </div>
                          </div>
                          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {puedeVerTracking(order.status) && (
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/dashboard-consumidor/tracking/${order.rawId}`)}
                                style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Navigation size={15} />
                                {order.status === 'en_camino' ? '🚴 Ver en tiempo real' : 'Seguimiento del pedido'}
                              </motion.button>
                            )}
                            {[{ icon: Download, label: 'Descargar factura' }, { icon: MessageSquare, label: 'Contactar soporte' }].map(({ icon: Icon, label }) => (
                              <motion.button key={label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, color: D.muted, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Icon size={15} /> {label}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <ClipboardList style={{ width: 64, height: 64, color: D.dim, margin: '0 auto 16px', opacity: 0.4 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>No se encontraron pedidos</h3>
              <p style={{ color: D.muted, marginBottom: 20 }}>No hay pedidos que coincidan con los filtros seleccionados.</p>
              <button onClick={() => { setSearchQuery(""); setStatusFilter("todos"); setDateFilter("todos") }}
                style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                Limpiar filtros
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default MisPedidos