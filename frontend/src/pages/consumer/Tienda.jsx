"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, SlidersHorizontal, ChevronDown, Waves, Store, Loader2, X, CheckCircle2, ArrowUpDown } from "lucide-react"
import ProductorCard from "../../components/features/ProductorCard"
import axios from "axios"
import { API_ENDPOINTS } from '../../config/apiConfig'
import PerfilProductorVista from "../../components/features/PerfilProductorVista"
import { SkeletonProductorCard } from '../../components/ui/Skeleton'
import { useTheme } from "../../contexts/ThemeContext"

const PAGE_SIZE = 9

const SORT_OPTIONS = [
  { value: '',          label: 'Más recientes' },
  { value: 'nombre',    label: 'Nombre A–Z' },
  { value: 'productos', label: 'Más productos' },
]

const Tienda = () => {
  const { D, isDark } = useTheme()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm]               = useState(() => searchParams.get('q') || "")
  const [selectedProductor, setSelectedProductor] = useState(null)

  const [showFilters, setShowFilters]             = useState(false)
  const [filterVerificado, setFilterVerificado]   = useState(false)
  const [filterCertificados, setFilterCertificados] = useState(false)
  const [sortBy, setSortBy]                       = useState('')

  const [productores, setProductores] = useState([])
  const [page, setPage]               = useState(1)
  const [hasMore, setHasMore]         = useState(true)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef                   = useRef(null)
  const searchDebounce                = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const activeFilters = filterVerificado || filterCertificados || sortBy !== ''

  const fetchPage = useCallback(async (pg, search, verificado, sort) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
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
      setHasMore(data.length === PAGE_SIZE)
    } catch { /* ignore */ }
    finally { setLoading(false); setLoadingMore(false) }
  }, [filterCertificados])

  useEffect(() => {
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => setDebouncedSearch(searchTerm), 350)
  }, [searchTerm])

  useEffect(() => {
    setPage(1); setProductores([]); setHasMore(true)
    fetchPage(1, debouncedSearch, filterVerificado, sortBy)
  }, [debouncedSearch, filterVerificado, filterCertificados, sortBy])

  useEffect(() => {
    if (page > 1) fetchPage(page, debouncedSearch, filterVerificado, sortBy)
  }, [page])

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading)
        setPage(p => p + 1)
    }, { threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading])

  const clearFilters = () => {
    setFilterVerificado(false); setFilterCertificados(false)
    setSortBy(''); setSearchTerm('')
  }

  if (selectedProductor)
    return <PerfilProductorVista productorId={selectedProductor} onBack={() => setSelectedProductor(null)} />

  // ── derived styles ────────────────────────────────────────────────────────
  const cardBg    = isDark ? 'rgba(255,255,255,0.03)' : D.surface
  const filterBg  = isDark ? 'rgba(255,255,255,0.025)' : D.surface
  const checkBg   = isDark ? 'rgba(255,255,255,0.05)' : D.bg
  const checkBord = isDark ? 'rgba(255,255,255,0.15)' : D.border
  const heroFade  = isDark ? '#060d1f' : D.bg

  return (
    <div style={{ minHeight: '100%', background: D.bg, overflowY: 'auto' }}>

      {/* ── Hero banner (kept dark as brand element) ──────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: 140 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0c1e45 0%, #0a1835 40%, #060d1f 100%)' }} />
        <div style={{ position: 'absolute', top: -40, left: '15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', top: -20, right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)', filter: 'blur(24px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to bottom, transparent, ${heroFade})` }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '32px 24px 24px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
              <Store size={20} color="#38bdf8" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #e2e8f0, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Productores
              </h1>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Acuicultura sostenible · Productos frescos</p>
            </div>
          </div>

          {/* Search inside hero */}
          <div style={{ position: 'relative', width: 288 }}>
            <input
              type="text"
              placeholder="Buscar productores..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 32, paddingTop: 10, paddingBottom: 10, borderRadius: 12, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#e2e8f0', backdropFilter: 'blur(8px)', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(56,189,248,0.2)'}
            />
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', pointerEvents: 'none' }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={14} style={{ color: '#64748b' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>

        {/* ── Stats strip ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16, marginTop: 16 }}>
          {[
            { label: 'Productores activos',   value: loading ? '…' : productores.length + (hasMore ? '+' : '') },
            { label: 'Productos disponibles', value: loading ? '…' : productores.reduce((a, p) => a + (p.total_productos || 0), 0).toString().padStart(3, '0') },
            { label: 'Verificados',           value: loading ? '…' : productores.filter(p => p.verificado).length },
          ].map(({ label, value }) => (
            <div key={label} className="np-hover" style={{ borderRadius: 12, padding: '12px 16px', textAlign: 'center', background: cardBg, border: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: D.primary, margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Filter bar ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ borderRadius: 12, overflow: 'hidden', background: filterBg, border: `1px solid ${activeFilters ? D.primary + '66' : D.border}`, marginBottom: 20 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <SlidersHorizontal size={15} style={{ color: activeFilters ? D.primary : D.muted }} />
              <span style={{ color: activeFilters ? D.primary : D.text, fontWeight: 600, fontSize: 14 }}>
                Filtros{activeFilters ? ' activos' : ''}
              </span>
              {activeFilters && (
                <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 700, background: `rgba(56,189,248,0.15)`, color: D.primary }}>
                  {[filterVerificado, filterCertificados, sortBy !== ''].filter(Boolean).length}
                </span>
              )}
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

                    {/* Verificado */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <button onClick={() => setFilterVerificado(v => !v)}
                        style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: filterVerificado ? 'rgba(56,189,248,0.2)' : checkBg, border: `1.5px solid ${filterVerificado ? D.primary : checkBord}`, cursor: 'pointer' }}>
                        {filterVerificado && <CheckCircle2 size={13} color={D.primary} />}
                      </button>
                      <span style={{ fontSize: 14, color: filterVerificado ? D.primary : D.muted }}>Solo verificados</span>
                    </label>

                    {/* Certificados */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <button onClick={() => setFilterCertificados(v => !v)}
                        style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: filterCertificados ? 'rgba(56,189,248,0.2)' : checkBg, border: `1.5px solid ${filterCertificados ? D.primary : checkBord}`, cursor: 'pointer' }}>
                        {filterCertificados && <CheckCircle2 size={13} color={D.primary} />}
                      </button>
                      <span style={{ fontSize: 14, color: filterCertificados ? D.primary : D.muted }}>Con certificaciones</span>
                    </label>

                    {/* Sort */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      <ArrowUpDown size={14} style={{ color: D.muted }} />
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={{ fontSize: 14, borderRadius: 8, padding: '6px 10px', outline: 'none', cursor: 'pointer', background: isDark ? 'rgba(255,255,255,0.06)' : D.bg, border: `1px solid ${sortBy ? D.primary + '88' : D.border}`, color: sortBy ? D.primary : D.muted }}>
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: isDark ? '#0e1a2e' : '#fff' }}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Grid ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonProductorCard key={i} />)}
          </div>
        ) : productores.length > 0 ? (
          <>
            <motion.div
              initial="hidden" animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {productores.map(productor => (
                <motion.div key={productor.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                  <ProductorCard productor={productor} onClick={() => setSelectedProductor(productor.id)} />
                </motion.div>
              ))}
            </motion.div>

            <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              {loadingMore && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: D.primary }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Cargando más productores...
                </div>
              )}
              {!hasMore && productores.length >= PAGE_SIZE && (
                <p style={{ fontSize: 12, color: D.dim }}>— Todos los productores cargados —</p>
              )}
            </div>
          </>
        ) : (
          <div style={{ borderRadius: 14, padding: '48px 24px', textAlign: 'center', background: cardBg, border: `1px solid ${D.border}` }}>
            <Waves size={36} style={{ color: D.dim, margin: '0 auto 12px' }} />
            <p style={{ color: D.muted, margin: '0 0 16px' }}>No se encontraron productores.</p>
            {(activeFilters || searchTerm) && (
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.primary, fontWeight: 600, fontSize: 14 }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tienda
