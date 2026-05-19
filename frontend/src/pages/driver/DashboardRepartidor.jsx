"use client"
import { useState, useEffect, useRef } from 'react'
import axiosInstance from '../../api/config/axios'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Bike, MapPin, Package, CheckCircle, Clock, RefreshCw, Key, LogOut, History, AlertCircle } from 'lucide-react'

const POLLING = 15000

const STATUS_COLOR = {
  listo_para_recoger: '#F59E0B',
  en_camino:          '#3B82F6',
  entregado:          '#22C55E',
  preparando:         '#8B5CF6',
  confirmado:         '#06B6D4',
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
  const [successMsg,       setSuccessMsg]       = useState(null)
  const [errorMsg,         setErrorMsg]         = useState(null)
  const pollingRef = useRef(null)

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
    pollingRef.current = setInterval(() => cargarPedidos(true), POLLING)
    return () => clearInterval(pollingRef.current)
  }, [])

  useEffect(() => {
    if (tab === 'historial') cargarHistorial()
  }, [tab])

  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 4000) }
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => { setSuccessMsg(null); cargarPedidos(true) }, 3000) }

  const confirmarCodigo = async () => {
    const limpio = codigo.toUpperCase().trim()
    if (limpio.length < 4) return
    const pedido = pedidos.find(p => p.codigo_retiro === limpio)
    if (!pedido) { showError('Código no encontrado. Verifica que el pedido esté "listo para recoger".'); return }
    setEnviandoCodigo(true)
    try {
      const res = await axiosInstance.post(`/repartidor/pedidos/${pedido.id}/recoger`, { codigo_retiro: limpio })
      setCodigo('')
      showSuccess(res.data?.message || '¡Pedido recogido correctamente! El consumidor fue notificado.')
    } catch (err) {
      showError(err.response?.data?.message || 'Error al confirmar el código')
    } finally {
      setEnviandoCodigo(false)
    }
  }

  const marcarEntregado = async (pedidoId) => {
    if (!window.confirm('¿Confirmar que entregaste el pedido al consumidor?')) return
    try {
      await axiosInstance.post(`/repartidor/pedidos/${pedidoId}/entregar`, {})
      cargarPedidos(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Error al marcar entregado')
    }
  }

  const pedidosActivos = pedidos.filter(p => p.estado === 'en_camino')
  const ordenados = [...pedidos].sort((a, b) => {
    const orden = { en_camino: 0, listo_para_recoger: 1, confirmado: 2, preparando: 3, pendiente: 4 }
    return (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9)
  })

  return (
    <div style={{ minHeight: '100vh', background: D.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '12px 24px', background: D.card, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: D.primary + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bike size={20} color={D.primary} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, color: D.text, fontSize: 16 }}>{user?.nombre || 'Repartidor'}</p>
          <p style={{ margin: 0, fontSize: 12, color: D.muted }}>Panel de entregas</p>
        </div>
        {pedidosActivos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', padding: '4px 10px', borderRadius: 20, border: '1px solid #86EFAC' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 2px #86EFAC' }} />
            <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>GPS activo · {pedidosActivos.length} en camino</span>
          </div>
        )}
        <button onClick={() => { if (window.confirm('¿Cerrar sesión?')) logout() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          <LogOut size={20} />
        </button>
      </div>

      <div style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Código de retiro */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Key size={18} color={D.primary} />
            <p style={{ margin: 0, fontWeight: 700, color: D.text, fontSize: 15 }}>Ingresar código del paquete</p>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: D.muted }}>El código está en el paquete. Ej: NP-2026-A3F9</p>

          {successMsg && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && confirmarCodigo()}
              placeholder="NP-2026-XXXX"
              maxLength={12}
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: `2px solid ${codigo.length >= 4 ? D.primary : D.border}`, background: D.bg, color: D.text, fontSize: 18, fontWeight: 700, letterSpacing: 3, outline: 'none', transition: 'border-color 0.2s' }}
            />
            <button
              onClick={confirmarCodigo}
              disabled={enviandoCodigo || codigo.trim().length < 4}
              style={{ padding: '12px 22px', borderRadius: 10, background: codigo.trim().length >= 4 ? `linear-gradient(135deg,${D.primary},#0369a1)` : D.border, color: '#fff', fontWeight: 700, border: 'none', cursor: codigo.trim().length >= 4 ? 'pointer' : 'not-allowed', fontSize: 14, opacity: enviandoCodigo ? 0.7 : 1 }}>
              {enviandoCodigo ? '...' : 'Confirmar'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'disponibles', label: `Disponibles (${pedidos.length})`, Icon: Package },
            { key: 'historial',   label: 'Historial',                        Icon: History  },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: tab === key ? 'none' : `1px solid ${D.border}`, background: tab === key ? `linear-gradient(135deg,${D.primary},#0369a1)` : D.card, color: tab === key ? '#fff' : D.text, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
              <div style={{ textAlign: 'center', padding: 48, background: D.card, border: `1px solid ${D.border}`, borderRadius: 14 }}>
                <CheckCircle size={40} color={D.dim} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>No hay pedidos disponibles por ahora</p>
              </div>
            ) : (
              ordenados.map(pedido => {
                const sc = STATUS_COLOR[pedido.estado] || '#9CA3AF'
                return (
                  <div key={pedido.id} style={{ background: D.card, border: `1px solid ${pedido.estado === 'en_camino' ? D.primary + '60' : D.border}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 700, color: D.text, fontSize: 15 }}>Pedido #{pedido.id}</p>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc + '20', color: sc }}>
                          {STATUS_LABEL[pedido.estado] || pedido.estado}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: D.primary }}>Bs. {parseFloat(pedido.total || 0).toFixed(2)}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: D.primary + '12', alignSelf: 'flex-start' }}>
                      <Key size={13} color={D.primary} />
                      <span style={{ fontWeight: 800, color: D.primary, fontSize: 14, letterSpacing: 2 }}>{pedido.codigo_retiro}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                        <MapPin size={14} color={D.muted} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: D.muted }}>{pedido.entrega_direccion}, {pedido.entrega_ciudad}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: D.muted }}>👤 {pedido.consumidor_nombre}{pedido.consumidor_telefono ? ` · ${pedido.consumidor_telefono}` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Clock size={13} color={D.dim} />
                        <span style={{ fontSize: 12, color: D.dim }}>{pedido.total_items} producto(s) · {formatFecha(pedido.fecha_pedido)}</span>
                      </div>
                    </div>

                    {pedido.estado === 'en_camino' && (
                      <button onClick={() => marcarEntregado(pedido.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 10, background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                        <CheckCircle size={18} /> Marcar como entregado
                      </button>
                    )}
                  </div>
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
              <div style={{ textAlign: 'center', padding: 48, background: D.card, border: `1px solid ${D.border}`, borderRadius: 14 }}>
                <p style={{ color: D.muted, margin: 0, fontSize: 14 }}>Aún no tienes entregas completadas</p>
              </div>
            ) : (
              historial.map(pedido => (
                <div key={pedido.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, color: D.text, fontSize: 14 }}>Pedido #{pedido.id}</p>
                    <p style={{ margin: '0 0 2px', fontSize: 13, color: D.muted }}>{pedido.consumidor_nombre}</p>
                    <p style={{ margin: 0, fontSize: 11, color: D.dim }}>{formatFecha(pedido.fecha_pedido)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#22C55E', fontSize: 15 }}>Bs. {parseFloat(pedido.total || 0).toFixed(2)}</p>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F0FDF4', color: '#16A34A', fontWeight: 600 }}>Entregado</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
