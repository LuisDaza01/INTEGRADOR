"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, SlidersHorizontal, ChevronDown, Waves, Store, Loader2, X,
  CheckCircle2, ArrowUpDown, Package, Users, Fish, CheckCircle,
} from "lucide-react"
import ProductorCard from "../../components/features/ProductorCard"
import ProductoTienda from "../../components/features/ProductoTienda"
import axios from "axios"
import api from "../../api/config/axios"
import { API_ENDPOINTS } from '../../config/apiConfig'
import PerfilProductorVista from "../../components/features/PerfilProductorVista"
import { SkeletonProductorCard } from '../../components/ui/Skeleton'
import { useTheme } from "../../contexts/ThemeContext"
import { agregarAlCarrito } from "../../api/services/carrito.service"

const PAGE_SIZE = 12

const SORT_PROD = [
  { value: '',          label: 'Más recientes' },
  { value: 'nombre',    label: 'Nombre A–Z' },
  { value: 'productos', label: 'Más productos' },
]

const SORT_PRODS = [
  { value: '',         label: 'Más recientes' },
  { value: 'precio',   label: 'Más barato' },
  { value: 'nombre',   label: 'Nombre A–Z' },
  { value: 'rating',   label: 'Mejor calificado' },
]

// ── Toast simple ─────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    if (!msg) return
    const id = setTimeout(onClose, 2500)
    return () => clearTimeout(id)
  }, [msg, onClose])
  if (!msg) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        padding: '12px 20px', borderRadius: 12,
        background: 'rgba(20,83,45,0.96)', border: '1px solid rgba(74,222,128,0.5)',
        color: '#fff', fontSize: 14, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 10px 30px rgba(20,83,45,0.5)', backdropFilter: 'blur(10px)',
      }}>
      <CheckCircle size={16} color="#4ade80" />{msg}
    </motion.div>
  )
}

const Tienda = () => {
  const { D, isDark } = useTheme()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || "")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedProductor, setSelectedProductor] = useState(null)
  const searchDebounce = useRef(null)

  // Vista activa
  const [viewMode, setViewMode] = useState('productos') // 'productos' | 'productores'

  // Toast
  const [toast, setToast] = useState(null)

  // Filtros / sort
  const [showFilters, setShowFilters] = useState(false)
  const [filterVerificado, setFilterVerificado] = useState(false)
  const [filterCertificados, setFilterCertificados] = useState(false)
  const [filterDisponibles, setFilterDisponibles] = useState(true)
  const [sortBy, setSortBy] = useState('')

  // ── Productores ──
  const [productores, setProductores] = useState([])
  const [pageProd, setPageProd] = useState(1)
  const [hasMoreProd, setHasMoreProd] = useState(true)
  const [loadingProd, setLoadingProd] = useState(true)
  const [loadingMoreProd, setLoadingMoreProd] = useState(false)

  // ── Productos ──
  const [productos, setProductos] = useState([])
  const [pageProds, setPageProds] = useState(1)
  const [hasMoreProds, setHasMoreProds] = useState(true)
  const [loadingProds, setLoadingProds] = useState(true)
  const [loadingMoreProds, setLoadingMoreProds] = useState(false)

  const sentinelRef = useRef(null)

  const activeFilters =
    (viewMode === 'productores' ? filterVerificado || filterCertificados : !filterDisponibles) ||
    sortBy !== ''

  // ── Debounce búsqueda ──
  useEffect(() => {
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => setDebouncedSearch(searchTerm), 350)
  }, [searchTerm])

  // ── Fetch productores ──
  const fetchProductores = useCallback(async (pg, search, verificado, sort) => {
    if (pg === 1) setLoadingProd(true); else setLoadingMoreProd(true)
    try {
      const params = { page: pg, limit: PAGE_SIZE }
      if (search)     params.q = search
      if (verificado) params.verificado = 'true'
      if (sort === 'nombre') params.sort = 'nombre'
      const r = await axios.get(API_ENDPOINTS.PRODUCTORES.BASE, { params })
      const raw = r.data?.data
      let data = Array.isArray(raw?.productores) ? raw.productores
               : Array.isArray(raw)               ? raw
               : Array.isArray(r.data)            ? r.data : []
      if (verificado && filterCertificados)
        data = data.filter(p => Array.isArray(p.certificaciones) && p.certificaciones.length > 0)
      if (sort === 'productos')
        data = [...data].sort((a, b) => (b.total_productos || 0) - (a.total_productos || 0))
      setProductores(prev => pg === 1 ? data : [...prev, ...data])
      setHasMoreProd(data.length === PAGE_SIZE)
    } catch { /* silent */ }
    finally { setLoadingProd(false); setLoadingMoreProd(false) }
  }, [filterCertificados])

  // ── Fetch productos ──
  const fetchProductos = useCallback(async (pg, search, sort, soloDisponibles) => {
    if (pg === 1) setLoadingProds(true); else setLoadingMoreProds(true)
    try {
      const params = { page: pg, limit: PAGE_SIZE }
      if (search) params.q = search
      const r = await api.get('/productos', { params })
      const raw = r.data?.data
      let data = Array.isArray(raw?.productos) ? raw.productos
               : Array.isArray(raw)             ? raw
               : Array.isArray(r.data)          ? r.data : []
      if (soloDisponibles) data = data.filter(p => p.disponible !== false && (p.stock == null || p.stock > 0))
      if (sort === 'precio') data = [...data].sort((a, b) => (parseFloat(a.precio) || 0) - (parseFloat(b.precio) || 0))
      if (sort === 'nombre') data = [...data].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
      if (sort === 'rating') data = [...data].sort((a, b) => (parseFloat(b.calificacion ?? b.promedio_valoracion ?? 0)) - (parseFloat(a.calificacion ?? a.promedio_valoracion ?? 0)))
      setProductos(prev => pg === 1 ? data : [...prev, ...data])
      setHasMoreProds(data.length === PAGE_SIZE)
    } catch { /* silent */ }
    finally { setLoadingProds(false); setLoadingMoreProds(false) }
  }, [])

  // ── Re-fetch al cambiar filtros / search / vista ──
  useEffect(() => {
    if (viewMode === 'productores') {
      setPageProd(1); setProductores([]); setHasMoreProd(true)
      fetchProductores(1, debouncedSearch, filterVerificado, sortBy)
    } else {
      setPageProds(1); setProductos([]); setHasMoreProds(true)
      fetchProductos(1, debouncedSearch, sortBy, filterDisponibles)
    }
  }, [viewMode, debouncedSearch, filterVerificado, filterCertificados, filterDisponibles, sortBy])

  // ── Paginación incremental ──
  useEffect(() => {
    if (viewMode === 'productores' && pageProd > 1) fetchProductores(pageProd, debouncedSearch, filterVerificado, sortBy)
  }, [pageProd])
  useEffect(() => {
    if (viewMode === 'productos' && pageProds > 1) fetchProductos(pageProds, debouncedSearch, sortBy, filterDisponibles)
  }, [pageProds])

  // ── IntersectionObserver para infinite scroll ──
  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      if (viewMode === 'productores' && hasMoreProd && !loadingMoreProd && !loadingProd) setPageProd(p => p + 1)
      if (viewMode === 'productos'   && hasMoreProds && !loadingMoreProds && !loadingProds) setPageProds(p => p + 1)
    }, { threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [viewMode, hasMoreProd, hasMoreProds, loadingMoreProd, loadingMoreProds, loadingProd, loadingProds])

  const clearFilters = () => {
    setFilterVerificado(false); setFilterCertificados(false)
    setFilterDisponibles(true); setSortBy(''); setSearchTerm('')
  }

  // ── Handler: agregar al carrito + toast ──
  const handleAddToCart = async (productoId) => {
    try {
      await agregarAlCarrito(productoId, 1)
      const prod = productos.find(p => p.id === productoId)
      setToast(`${prod?.nombre || 'Producto'} agregado a tu reserva`)
    } catch (err) {
      setToast(err?.response?.data?.message || 'No se pudo agregar')
    }
  }

  if (selectedProductor)
    return <PerfilProductorVista productorId={selectedProductor} onBack={() => setSelectedProductor(null)} />

  // ── Derived styles ──
  const cardBg    = isDark ? 'rgba(255,255,255,0.03)' : D.surface
  const filterBg  = isDark ? 'rgba(255,255,255,0.025)' : D.surface
  const checkBg   = isDark ? 'rgba(255,255,255,0.05)' : D.bg
  const checkBord = isDark ? 'rgba(255,255,255,0.15)' : D.border
  const heroFade  = isDark ? '#060d1f' : D.bg

  const sortOptions = viewMode === 'productos' ? SORT_PRODS : SORT_PROD

  // ── Stats por vista ──
  const stats = viewMode === 'productores'
    ? [
        { label: 'Productores activos', value: loadingProd ? '…' : productores.length + (hasMoreProd ? '+' : '') },
        { label: 'Productos disponibles', value: loadingProd ? '…' : productores.reduce((a, p) => a + (p.total_productos || 0), 0).toString().padStart(3, '0') },
        { label: 'Verificados', value: loadingProd ? '…' : productores.filter(p => p.verificado).length },
      ]
    : [
        { label: 'Productos en catálogo', value: loadingProds ? '…' : productos.length + (hasMoreProds ? '+' : '') },
        { label: 'Disponibles ahora', value: loadingProds ? '…' : productos.filter(p => p.disponible !== false && (p.stock == null || p.stock > 0)).length },
        { label: 'Por kilo', value: loadingProds ? '…' : productos.filter(p => ['kg','Kg','KG'].includes(p.unidad)).length },
      ]

  return (
    <div style={{ minHeight: '100%', background: D.bg, overflowY: 'auto' }}>

      <AnimatePresence>{toast && <Toast msg={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 140 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0c1e45 0%, #0a1835 40%, #060d1f 100%)' }} />
        <div style={{ position: 'absolute', top: -40, left: '15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', top: -20, right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to bottom, transparent, ${heroFade})` }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '32px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <Store size={20} color="#22C55E" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #e2e8f0, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Tienda
              </h1>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Acuicultura sostenible · Productos frescos</p>
            </div>
          </div>

          {/* Buscar */}
          <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
            <input
              type="text"
              placeholder={viewMode === 'productos' ? 'Buscar productos...' : 'Buscar productores...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 32, paddingTop: 10, paddingBottom: 10, borderRadius: 12, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#e2e8f0', backdropFilter: 'blur(8px)', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(34,197,94,0.2)'}
            />
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E', pointerEvents: 'none' }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={14} style={{ color: '#64748b' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>

        {/* ── Toggle Productos | Productores ─────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 0, padding: 4, borderRadius: 12, background: cardBg, border: `1px solid ${D.border}`, marginTop: 16, marginBottom: 16, maxWidth: 360 }}>
          {[
            { key: 'productos',   icon: Package, label: 'Productos' },
            { key: 'productores', icon: Users,   label: 'Productores' },
          ].map(({ key, icon: Icon, label }) => {
            const active = viewMode === key
            return (
              <button key={key} onClick={() => setViewMode(key)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontSize: 13, fontWeight: 700,
                  background: active ? `linear-gradient(135deg, ${D.primary}, #16a34a)` : 'transparent',
                  color: active ? '#fff' : D.muted,
                  boxShadow: active ? `0 4px 14px ${D.primary}55` : 'none',
                  transition: 'all 0.2s',
                }}>
                <Icon size={14} /> {label}
              </button>
            )
          })}
        </motion.div>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="np-stats-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          <style>{`@media (max-width: 600px) { .np-stats-grid { grid-template-columns: 1fr !important; } }`}</style>
          {stats.map(({ label, value }) => (
            <div key={label} className="np-hover" style={{ borderRadius: 12, padding: '12px 16px', textAlign: 'center', background: cardBg, border: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: D.primary, margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Filter bar ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ borderRadius: 12, overflow: 'hidden', background: filterBg, border: `1px solid ${activeFilters ? D.primary + '66' : D.border}`, marginBottom: 20 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <SlidersHorizontal size={15} style={{ color: activeFilters ? D.primary : D.muted }} />
              <span style={{ color: activeFilters ? D.primary : D.text, fontWeight: 600, fontSize: 14 }}>
                Filtros{activeFilters ? ' activos' : ''}
              </span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {activeFilters && (
                <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: D.muted, fontSize: 13 }}>
                  <X size={12} /> Limpiar
                </button>
              )}
              <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.primary }}>
                <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}>
                <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${D.border}` }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 12 }}>

                    {viewMode === 'productores' ? (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <button onClick={() => setFilterVerificado(v => !v)}
                            style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: filterVerificado ? 'rgba(34,197,94,0.2)' : checkBg, border: `1.5px solid ${filterVerificado ? D.primary : checkBord}`, cursor: 'pointer' }}>
                            {filterVerificado && <CheckCircle2 size={13} color={D.primary} />}
                          </button>
                          <span style={{ fontSize: 14, color: filterVerificado ? D.primary : D.muted }}>Solo verificados</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <button onClick={() => setFilterCertificados(v => !v)}
                            style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: filterCertificados ? 'rgba(34,197,94,0.2)' : checkBg, border: `1.5px solid ${filterCertificados ? D.primary : checkBord}`, cursor: 'pointer' }}>
                            {filterCertificados && <CheckCircle2 size={13} color={D.primary} />}
                          </button>
                          <span style={{ fontSize: 14, color: filterCertificados ? D.primary : D.muted }}>Con certificaciones</span>
                        </label>
                      </>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <button onClick={() => setFilterDisponibles(v => !v)}
                          style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: filterDisponibles ? 'rgba(34,197,94,0.2)' : checkBg, border: `1.5px solid ${filterDisponibles ? D.primary : checkBord}`, cursor: 'pointer' }}>
                          {filterDisponibles && <CheckCircle2 size={13} color={D.primary} />}
                        </button>
                        <span style={{ fontSize: 14, color: filterDisponibles ? D.primary : D.muted }}>Solo disponibles</span>
                      </label>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      <ArrowUpDown size={14} style={{ color: D.muted }} />
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={{ fontSize: 14, borderRadius: 8, padding: '6px 10px', outline: 'none', cursor: 'pointer', background: isDark ? 'rgba(255,255,255,0.06)' : D.bg, border: `1px solid ${sortBy ? D.primary + '88' : D.border}`, color: sortBy ? D.primary : D.muted }}>
                        {sortOptions.map(o => <option key={o.value} value={o.value} style={{ background: isDark ? '#0e1a2e' : '#fff' }}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Grid ───────────────────────────────────────────────── */}
        {viewMode === 'productores' ? (
          loadingProd ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonProductorCard key={i} />)}
            </div>
          ) : productores.length > 0 ? (
            <>
              <motion.div initial="hidden" animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                {productores.map(p => (
                  <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                    <ProductorCard productor={p} onClick={() => setSelectedProductor(p.id)} />
                  </motion.div>
                ))}
              </motion.div>
              <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                {loadingMoreProd && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: D.primary }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cargando más…
                  </div>
                )}
                {!hasMoreProd && productores.length >= PAGE_SIZE && (
                  <p style={{ fontSize: 12, color: D.dim }}>— Todos los productores cargados —</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState D={D} cardBg={cardBg} icon={<Waves size={36} style={{ color: D.dim, margin: '0 auto 12px' }} />}
              text="No se encontraron productores." onClear={clearFilters} hasFilters={activeFilters || searchTerm} />
          )
        ) : (
          loadingProds ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonProductoCard key={i} D={D} />)}
            </div>
          ) : productos.length > 0 ? (
            <>
              <motion.div initial="hidden" animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                {productos.map(p => (
                  <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    onClick={() => p.productor_id && setSelectedProductor(p.productor_id)}
                    style={{ cursor: 'pointer' }}>
                    <ProductoTienda producto={p} onAddToCart={handleAddToCart} />
                  </motion.div>
                ))}
              </motion.div>
              <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                {loadingMoreProds && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: D.primary }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cargando más…
                  </div>
                )}
                {!hasMoreProds && productos.length >= PAGE_SIZE && (
                  <p style={{ fontSize: 12, color: D.dim }}>— Todos los productos cargados —</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState D={D} cardBg={cardBg} icon={<Fish size={36} style={{ color: D.dim, margin: '0 auto 12px' }} />}
              text="No se encontraron productos." onClear={clearFilters} hasFilters={activeFilters || searchTerm} />
          )
        )}
      </div>
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────
const EmptyState = ({ D, cardBg, icon, text, onClear, hasFilters }) => (
  <div style={{ borderRadius: 14, padding: '48px 24px', textAlign: 'center', background: cardBg, border: `1px solid ${D.border}` }}>
    {icon}
    <p style={{ color: D.muted, margin: '0 0 16px' }}>{text}</p>
    {hasFilters && (
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.primary, fontWeight: 600, fontSize: 14 }}>
        Limpiar filtros
      </button>
    )}
  </div>
)

const SkeletonProductoCard = ({ D }) => (
  <div style={{ borderRadius: 14, overflow: 'hidden', background: D.surface, border: `1px solid ${D.border}` }}>
    <div style={{ aspectRatio: '1/1', background: 'linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 70%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
    <div style={{ padding: 12 }}>
      <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 8, width: '70%' }} />
      <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '50%' }} />
    </div>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
)

export default Tienda
