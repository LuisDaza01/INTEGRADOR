"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingBag, ChevronLeft, ChevronRight, Eye, X, User, Package } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"

const ESTADOS = ["todos", "pendiente", "confirmado", "enviado", "entregado", "cancelado"]

const estadoColor = {
  pendiente:  { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24' },
  confirmado: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)',  text: '#22C55E' },
  enviado:    { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.35)', text: '#4ade80' },
  entregado:  { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.35)', text: '#4ade80' },
  cancelado:  { bg: 'rgba(248,113,113,0.15)',border: 'rgba(248,113,113,0.35)',text: '#f87171' },
}

const PedidosAdmin = () => {
  const { user } = useAuth()
  const { D } = useTheme()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const PER_PAGE = 10

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get("/pedidos/admin/todos")
        const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
        setPedidos(data)
      } catch (err) { if (import.meta.env.DEV) console.error(err) }
      finally { setLoading(false) }
    }
    if (user) fetchPedidos()
  }, [user])

  const handleVerDetalle = async (p) => {
    setDetalle({ ...p, items: null })
    setDetalleLoading(true)
    try {
      const res = await axiosInstance.get(`/pedidos/${p.id}`)
      const data = res.data.data || res.data
      setDetalle(data)
    } catch (err) { setDetalle(p) }
    finally { setDetalleLoading(false) }
  }

  const filtered = pedidos.filter(p => {
    const matchSearch = String(p.id).includes(search) ||
      (p.consumidor?.toLowerCase() || '').includes(search.toLowerCase())
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado
    return matchSearch && matchEstado
  })
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const Spinner = ({ size = 40 }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `3px solid ${D.border}`, borderTopColor: D.primary,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (loading) return <Spinner size={48} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.5px' }}>Pedidos</h2>
          <p style={{ color: D.muted, fontSize: 13, margin: '4px 0 0' }}>{pedidos.length} pedidos en total</p>
        </div>
        <div style={{ position: 'relative', width: 'min(280px, 100%)' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: D.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por ID o consumidor..."
            style={{
              width: '100%',
              background: D.card, border: `1px solid ${D.border}`,
              color: D.text, fontSize: 13,
              borderRadius: 12, padding: '10px 14px 10px 36px',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = D.primary}
            onBlur={e => e.target.style.borderColor = D.border} />
        </div>
      </div>

      {/* Filtros pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ESTADOS.map(e => {
          const sel = filtroEstado === e
          return (
            <button key={e} onClick={() => { setFiltroEstado(e); setPage(1) }}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
                border: `1px solid ${sel ? D.primary : D.border}`,
                background: sel ? `rgba(34,197,94,0.15)` : D.card,
                color: sel ? D.primary : D.muted,
                transition: 'all 0.15s',
              }}>
              {e}
            </button>
          )
        })}
      </div>

      {/* Tabla */}
      <div style={{
        background: D.card, borderRadius: 16,
        border: `1px solid ${D.border}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(34,197,94,0.05)', borderBottom: `1px solid ${D.border}` }}>
                <th style={th(D)}>ID</th>
                <th className="hidden md:table-cell" style={th(D)}>Consumidor</th>
                <th className="hidden sm:table-cell" style={th(D)}>Fecha</th>
                <th className="hidden md:table-cell" style={th(D)}>Total</th>
                <th style={th(D)}>Estado</th>
                <th style={th(D)} />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: D.muted, fontSize: 13 }}>No se encontraron pedidos</td></tr>
              ) : paginated.map((p, i) => {
                const es = estadoColor[p.estado] || { bg: D.inputBg, border: D.border, text: D.muted }
                return (
                  <motion.tr key={p.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={td()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <ShoppingBag size={13} style={{ color: '#fb923c' }} />
                        </div>
                        <span style={{ color: D.text, fontSize: 13, fontFamily: "'Fira Code', monospace", fontWeight: 600 }}>#{p.id}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell" style={td()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={11} style={{ color: D.primary }} />
                        </div>
                        <span style={{ color: D.sub, fontSize: 13 }}>{p.consumidor || "—"}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell" style={td()}>
                      <span style={{ color: D.muted, fontSize: 13 }}>
                        {p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString("es-BO") : "—"}
                      </span>
                    </td>
                    <td className="hidden md:table-cell" style={td()}>
                      <span style={{ color: D.primary, fontSize: 13, fontWeight: 700, fontFamily: "'Fira Code', monospace" }}>
                        Bs {parseFloat(p.total || 0).toFixed(2)}
                      </span>
                    </td>
                    <td style={td()}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 10px', borderRadius: 999,
                        background: es.bg, border: `1px solid ${es.border}`,
                        color: es.text, fontSize: 11, fontWeight: 700,
                        textTransform: 'capitalize',
                      }}>
                        {p.estado || "—"}
                      </span>
                    </td>
                    <td style={td()}>
                      <button onClick={() => handleVerDetalle(p)}
                        style={{
                          padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: 'transparent', color: D.muted, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; e.currentTarget.style.color = D.primary }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.muted }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', borderTop: `1px solid ${D.border}`,
            background: 'rgba(34,197,94,0.03)',
          }}>
            <p style={{ color: D.muted, fontSize: 12, margin: 0 }}>Página {page} de {totalPages}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{
                  padding: 6, borderRadius: 8, border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  background: 'transparent', color: D.muted, opacity: page === 1 ? 0.3 : 1,
                }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{
                  padding: 6, borderRadius: 8, border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  background: 'transparent', color: D.muted, opacity: page === totalPages ? 0.3 : 1,
                }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <AnimatePresence>
        {detalle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setDetalle(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: D.card, borderRadius: 18,
                padding: 24, maxWidth: 540, width: '100%',
                maxHeight: '90vh', overflowY: 'auto',
                border: `1px solid ${D.border}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.1)',
              }}
              onClick={e => e.stopPropagation()}>
              {/* Header modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ShoppingBag size={18} style={{ color: '#fb923c' }} />
                  </div>
                  <div>
                    <h3 style={{ color: D.text, fontWeight: 700, fontSize: 18, margin: 0, fontFamily: "'Fira Code', monospace" }}>Pedido #{detalle.id}</h3>
                    <span style={{
                      display: 'inline-flex', padding: '2px 10px', borderRadius: 999,
                      background: (estadoColor[detalle.estado] || { bg: D.inputBg }).bg,
                      color: (estadoColor[detalle.estado] || { text: D.muted }).text,
                      fontSize: 10, fontWeight: 700, marginTop: 4, textTransform: 'capitalize',
                    }}>
                      {detalle.estado}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetalle(null)} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: D.muted, cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {detalleLoading ? <Spinner size={32} /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Consumidor */}
                  <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: 12, padding: 14, border: `1px solid ${D.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Consumidor</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={15} color="#fff" />
                      </div>
                      <div>
                        <p style={{ color: D.text, fontWeight: 600, fontSize: 14, margin: 0 }}>{detalle.consumidor || "—"}</p>
                        {detalle.consumidor_email && <p style={{ color: D.muted, fontSize: 12, margin: '2px 0 0' }}>{detalle.consumidor_email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Info del pedido */}
                  <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: 12, padding: 14, border: `1px solid ${D.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Detalles del pedido</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      {[
                        ["Fecha",        detalle.fecha_pedido ? new Date(detalle.fecha_pedido).toLocaleString("es-BO") : "—"],
                        ["Método envío", detalle.metodo_envio || "—"],
                        ["Costo envío",  `Bs ${parseFloat(detalle.costo_envio || 0).toFixed(2)}`],
                        ["Total",        <span style={{ color: D.primary, fontWeight: 700, fontFamily: "'Fira Code', monospace" }}>Bs {parseFloat(detalle.total || 0).toFixed(2)}</span>],
                      ].map(([label, value], idx, arr) => (
                        <div key={label} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 0', borderBottom: idx < arr.length - 1 ? `1px solid ${D.border}` : 'none',
                        }}>
                          <span style={{ color: D.muted }}>{label}</span>
                          <span style={{ color: D.text }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Productos del pedido */}
                  {detalle.items && detalle.items.length > 0 && (
                    <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: 12, padding: 14, border: `1px solid ${D.border}` }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Productos</p>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {detalle.items.map((item, i) => (
                          <div key={i} style={{ padding: '10px 0', borderBottom: i < detalle.items.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Package size={14} style={{ color: D.primary }} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ color: D.text, fontWeight: 600, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre || `Producto #${item.producto_id}`}</p>
                                  <p style={{ color: D.muted, fontSize: 11, margin: '2px 0 0' }}>x{item.cantidad} · Bs {parseFloat(item.precio_unitario || 0).toFixed(2)} c/u</p>
                                </div>
                              </div>
                              <span style={{ color: D.sub, fontSize: 13, fontWeight: 600, fontFamily: "'Fira Code', monospace", flexShrink: 0 }}>
                                Bs {(item.cantidad * parseFloat(item.precio_unitario || 0)).toFixed(2)}
                              </span>
                            </div>
                            {item.productor_nombre && (
                              <div style={{ marginTop: 6, marginLeft: 40, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <User size={10} style={{ color: D.primary }} />
                                <span style={{ color: D.primary, fontSize: 11, fontWeight: 600 }}>{item.productor_empresa || item.productor_nombre}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setDetalle(null)}
                style={{
                  marginTop: 18, width: '100%',
                  padding: '11px 0', borderRadius: 12,
                  border: `1px solid ${D.border}`,
                  background: 'rgba(34,197,94,0.06)', color: D.text,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  minHeight: 44,
                }}>
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const th = (D) => ({
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  color: D.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '12px 18px',
  whiteSpace: 'nowrap',
})

const td = () => ({
  padding: '13px 18px',
  fontSize: 13,
})

export default PedidosAdmin
