"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Package, Trash2, ChevronLeft, ChevronRight, AlertCircle, Star, TrendingUp } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"

const ProductosAdmin = () => {
  const { user } = useAuth()
  const { D } = useTheme()
  const [productos, setProductos] = useState([])
  const [masVendidos, setMasVendidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingVendidos, setLoadingVendidos] = useState(true)
  const [tab, setTab] = useState("todos")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const PER_PAGE = 10

  useEffect(() => { if (user) fetchProductos(); }, [user])
  useEffect(() => { if (user) fetchMasVendidos(); }, [user])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get("/productos")
      const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setProductos(data)
    } catch (err) { if (import.meta.env.DEV) console.error(err) }
    finally { setLoading(false) }
  }

  const fetchMasVendidos = async () => {
    try {
      setLoadingVendidos(true)
      const res = await axiosInstance.get("/productos?order=fecha_desc&limit=100")
      const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setMasVendidos(data)
    } catch (err) { if (import.meta.env.DEV) console.error(err) }
    finally { setLoadingVendidos(false) }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/productos/${id}`)
      setProductos(prev => prev.filter(p => p.id !== id))
      setConfirmDelete(null)
    } catch (err) { if (import.meta.env.DEV) console.error(err) }
  }

  const handleToggleDestacado = async (producto) => {
    try {
      await axiosInstance.patch(`/productos/${producto.id}/destacar`, { destacado: !producto.destacado })
      const update = prev => prev.map(p => p.id === producto.id ? { ...p, destacado: !p.destacado } : p)
      setProductos(update)
      setMasVendidos(update)
    } catch (err) { if (import.meta.env.DEV) console.error(err) }
  }

  const filtered = productos.filter(p =>
    (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const ProductRow = ({ p, i, showDelete = true }) => (
    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
      style={{ borderBottom: `1px solid ${D.border}`, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={td()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {p.imagen
              ? <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Package size={16} style={{ color: D.primary }} />}
          </div>
          <span style={{ color: D.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{p.nombre}</span>
        </div>
      </td>
      <td className="hidden md:table-cell" style={td()}>
        <span style={{ color: D.muted, fontSize: 13 }}>{p.categoria || "—"}</span>
      </td>
      <td className="hidden sm:table-cell" style={td()}>
        <span style={{ color: D.primary, fontSize: 13, fontWeight: 700, fontFamily: "'Fira Code', monospace" }}>
          Bs {parseFloat(p.precio || 0).toFixed(2)}
        </span>
      </td>
      <td className="hidden lg:table-cell" style={td()}>
        <span style={{ color: D.sub, fontSize: 13 }}>{p.stock ?? "—"} {p.unidad || ""}</span>
      </td>
      <td className="hidden sm:table-cell" style={td()}>
        <span style={{
          display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
          background: p.disponible ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
          border: `1px solid ${p.disponible ? 'rgba(34,197,94,0.3)' : D.border}`,
          color: p.disponible ? D.primary : D.muted,
          fontSize: 11, fontWeight: 700,
        }}>
          {p.disponible ? "Disponible" : "No disponible"}
        </span>
      </td>
      <td style={{ ...td(), padding: '13px 10px' }}>
        <button onClick={() => handleToggleDestacado(p)}
          title={p.destacado ? "Quitar destacado" : "Marcar como destacado"}
          style={{
            padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: p.destacado ? 'rgba(251,191,36,0.15)' : 'transparent',
            color: p.destacado ? '#fbbf24' : D.muted,
            transition: 'all 0.15s',
          }}>
          <Star size={15} fill={p.destacado ? "currentColor" : "none"} />
        </button>
      </td>
      {showDelete && (
        <td style={{ ...td(), padding: '13px 10px' }}>
          <button onClick={() => setConfirmDelete(p)}
            style={{
              padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: D.muted, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = D.red }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.muted }}>
            <Trash2 size={15} />
          </button>
        </td>
      )}
    </motion.tr>
  )

  const TableHeader = ({ showDelete = true }) => (
    <thead>
      <tr style={{ background: 'rgba(34,197,94,0.05)', borderBottom: `1px solid ${D.border}` }}>
        <th style={th(D)}>Producto</th>
        <th className="hidden md:table-cell" style={th(D)}>Categoría</th>
        <th className="hidden sm:table-cell" style={th(D)}>Precio</th>
        <th className="hidden lg:table-cell" style={th(D)}>Stock</th>
        <th className="hidden sm:table-cell" style={th(D)}>Estado</th>
        <th style={{ ...th(D), padding: '12px 10px' }}>Destacado</th>
        {showDelete && <th style={{ padding: '12px 10px' }} />}
      </tr>
    </thead>
  )

  const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.primary, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.5px' }}>Productos</h2>
          <p style={{ color: D.muted, fontSize: 13, margin: '4px 0 0' }}>{productos.length} productos registrados</p>
        </div>
        <div style={{ position: 'relative', width: 'min(280px, 100%)' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: D.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar producto..."
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'todos',    label: 'Todos los productos', icon: Package },
          { id: 'vendidos', label: 'Destacar productos',  icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => {
          const sel = tab === id
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 12,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${sel ? D.primary : D.border}`,
                background: sel ? 'rgba(34,197,94,0.15)' : D.card,
                color: sel ? D.primary : D.muted,
                transition: 'all 0.15s',
              }}>
              <Icon size={14} /> {label}
            </button>
          )
        })}
      </div>

      {/* Tab: Todos */}
      {tab === "todos" && (
        <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <TableHeader showDelete={true} />
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: D.muted, fontSize: 13 }}>No se encontraron productos</td></tr>
                ) : paginated.map((p, i) => <ProductRow key={p.id} p={p} i={i} showDelete={true} />)}
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
                  style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: D.muted, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: D.muted, opacity: page === totalPages ? 0.3 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Destacar productos */}
      {tab === "vendidos" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 12, padding: '11px 14px', color: D.text, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Star size={16} style={{ color: '#fbbf24' }} fill="currentColor" />
            Haz clic en la estrella para destacar o quitar el destacado. Los destacados aparecen primero en la tienda.
          </div>

          {loadingVendidos ? <Spinner /> : (
            <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHeader showDelete={false} />
                  <tbody>
                    {masVendidos.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: D.muted, fontSize: 13 }}>No hay productos</td></tr>
                    ) : masVendidos.map((p, i) => <ProductRow key={p.id} p={p} i={i} showDelete={false} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, backdropFilter: 'blur(4px)',
            }}
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="np-confirm-modal"
              style={{
                background: D.card, borderRadius: 18,
                maxWidth: 380, width: '100%',
                border: `1px solid rgba(248,113,113,0.3)`,
                boxShadow: '0 0 40px rgba(248,113,113,0.15)',
              }}
              onClick={e => e.stopPropagation()}>
              <style>{`
                .np-confirm-modal { padding: 24px; }
                .np-confirm-modal .actions { display: flex; gap: 10px; }
                @media (max-width: 420px) {
                  .np-confirm-modal { padding: 18px; }
                  .np-confirm-modal .actions { flex-direction: column-reverse; gap: 8px; }
                }
              `}</style>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AlertCircle size={20} style={{ color: D.red }} />
                </div>
                <div>
                  <h3 style={{ color: D.text, fontWeight: 700, fontSize: 16, margin: 0 }}>Eliminar producto</h3>
                  <p style={{ color: D.muted, fontSize: 12, margin: '2px 0 0' }}>Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p style={{ color: D.sub, fontSize: 14, margin: '0 0 18px' }}>
                ¿Eliminar <span style={{ color: D.text, fontWeight: 600 }}>"{confirmDelete.nombre}"</span>?
              </p>
              <div className="actions">
                <button onClick={() => setConfirmDelete(null)}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10,
                    border: `1px solid ${D.border}`, background: 'rgba(34,197,94,0.06)',
                    color: D.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44,
                  }}>
                  Cancelar
                </button>
                <button onClick={() => handleDelete(confirmDelete.id)}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44,
                  }}>
                  Eliminar
                </button>
              </div>
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

export default ProductosAdmin
