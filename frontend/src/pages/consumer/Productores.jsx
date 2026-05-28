"use client"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { useNavigate, useSearchParams } from "react-router-dom"
import { API_ENDPOINTS } from '../../config/apiConfig'
import { useTheme } from "../../contexts/ThemeContext"
import {
  Search, Filter, MapPin, Star, Award, Calendar, Fish, Users, Clock,
  ChevronDown, X, Eye, Phone, Mail, Globe, AlertCircle, RefreshCw,
  Package, Truck, Shield, Zap
} from "lucide-react"

const Productores = () => {
  const { D } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Estados principales
  const [productores, setProductores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || "")
  const [selectedSpecialty, setSelectedSpecialty] = useState("")
  const [selectedRating, setSelectedRating] = useState("")
  const [selectedAvailability, setSelectedAvailability] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("nombre")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 12

  // Especialidades dinámicas basadas en los datos
  const especialidades = useMemo(() => {
    const specs = productores
      .map(p => p.especialidad)
      .filter(Boolean)
      .filter((spec, index, arr) => arr.indexOf(spec) === index)
    return specs
  }, [productores])

  const diasSemana = [
    { key: "lunes", label: "L" },
    { key: "martes", label: "M" },
    { key: "miercoles", label: "M" },
    { key: "jueves", label: "J" },
    { key: "viernes", label: "V" },
    { key: "sabado", label: "S" },
    { key: "domingo", label: "D" },
  ]

  // Función para cargar productores
  const fetchProductores = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Cargando productores...")
      
      const response = await axios.get(API_ENDPOINTS.PRODUCTORES.BASE)  // ✅ CORREGIDO
      console.log("✅ Respuesta completa:", response.data)
      
      // ✅ Manejar formato con wrapper { success, data: { productores: [] } }
      const productoresData = response.data.data?.productores || response.data.productores || response.data || []
      console.log("✅ Productores procesados:", productoresData)
      
      // Verificar que sea un array
      if (!Array.isArray(productoresData)) {
        console.error("❌ Los datos no son un array:", productoresData)
        setError("Formato de datos inválido")
        return
      }
      
      // Procesar datos para asegurar tipos correctos
      const productoresProcesados = productoresData.map(productor => ({
        ...productor,
        rating: parseFloat(productor.rating) || 0,
        total_reviews: parseInt(productor.total_reviews) || 0,
        productos_count: parseInt(productor.productos_count) || 0,
        years_experience: parseInt(productor.years_experience) || parseInt(productor.experiencia) || 0,
        nombre_empresa: productor.nombre_empresa || productor.nombreEmpresa || "",
        ciudad: productor.ciudad || productor.ubicacion || "",
        descripcion: productor.descripcion || productor.descripcion_chaco || "",
        certificaciones: Array.isArray(productor.certificaciones) 
          ? productor.certificaciones 
          : (productor.certificaciones ? [productor.certificaciones] : []),
        productos_destacados: Array.isArray(productor.productos_destacados)
          ? productor.productos_destacados
          : [],
        dias_venta: typeof productor.dias_venta === 'object' 
          ? productor.dias_venta 
          : {},
        is_available_today: Boolean(productor.is_available_today)
      }))
      
      setProductores(productoresProcesados)
    } catch (error) {
      console.error("❌ Error al obtener productores:", error)
      console.error("Response:", error.response?.data)
      setError(error.response?.data?.message || error.response?.data?.error || "Error al cargar productores")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductores()
  }, [])

  // Filtrar y ordenar productores
  const filteredAndSortedProductores = useMemo(() => {
    let filtered = productores.filter((productor) => {
      // Filtro de búsqueda
      const searchMatch = !searchTerm || [
        productor.nombre,
        productor.nombre_empresa,
        productor.ciudad,
        productor.descripcion,
        productor.especialidad
      ].some(field => 
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      // Filtro de especialidad
      const specialtyMatch = !selectedSpecialty || productor.especialidad === selectedSpecialty

      // Filtro de calificación
      const ratingMatch = !selectedRating || productor.rating >= parseFloat(selectedRating)

      // Filtro de disponibilidad
      const availabilityMatch = !selectedAvailability || 
        (selectedAvailability === "available" && productor.is_available_today) ||
        (selectedAvailability === "unavailable" && !productor.is_available_today)

      return searchMatch && specialtyMatch && ratingMatch && availabilityMatch
    })

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "nombre":
          return (a.nombre || "").localeCompare(b.nombre || "")
        case "rating":
          return b.rating - a.rating
        case "productos":
          return b.productos_count - a.productos_count
        case "experiencia":
          return b.years_experience - a.years_experience
        default:
          return 0
      }
    })

    return filtered
  }, [productores, searchTerm, selectedSpecialty, selectedRating, selectedAvailability, sortBy])

  // Estadísticas calculadas
  const stats = useMemo(() => {
    if (productores.length === 0) return { total: 0, disponibles: 0, productos: 0, rating: 0 }
    
    return {
      total: productores.length,
      disponibles: productores.filter(p => p.is_available_today).length,
      productos: productores.reduce((sum, p) => sum + p.productos_count, 0),
      rating: productores.reduce((sum, p) => sum + p.rating, 0) / productores.length
    }
  }, [productores])

  const handleProductorClick = (productorId) => {
    navigate(`/dashboard-consumidor/productor/${productorId}`)
  }

  useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedSpecialty, selectedRating, selectedAvailability, sortBy])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedSpecialty("")
    setSelectedRating("")
    setSelectedAvailability("")
  }

  const hasActiveFilters = searchTerm || selectedSpecialty || selectedRating || selectedAvailability

  // ── Loading & error ────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <motion.div style={{ textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: `4px solid ${D.primary}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 6 }}>Cargando productores</h3>
          <p style={{ color: D.muted }}>Obteniendo información actualizada...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <motion.div style={{ textAlign: 'center', padding: 32, background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, maxWidth: 400, width: '90%' }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <AlertCircle style={{ width: 64, height: 64, color: D.red, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>Error al cargar productores</h3>
          <p style={{ color: D.muted, marginBottom: 24 }}>{error}</p>
          <button onClick={fetchProductores} style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} /> Reintentar
          </button>
        </motion.div>
      </div>
    )
  }

  const selectStyle = { background: D.surface, border: `1px solid ${D.border}`, color: D.text, borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%' }

  return (
    <div style={{ background: D.bg, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <motion.div style={{ background: D.surface, borderBottom: `1px solid ${D.border}` }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: D.text, margin: 0 }}>Productores Acuícolas</h1>
              <p style={{ marginTop: 4, color: D.muted, fontSize: 14 }}>
                Descubre {stats.total} productores certificados y sus especialidades
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: D.primary, pointerEvents: 'none' }} size={16} />
                <input type="text" placeholder="Buscar productores, ciudades..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 36, paddingRight: searchTerm ? 36 : 12, paddingTop: 9, paddingBottom: 9, background: 'rgba(34,197,94,0.05)', border: `1px solid ${D.border}`, borderRadius: 10, color: D.text, fontSize: 13, outline: 'none', width: 240 }}
                  onFocus={e => e.target.style.borderColor = D.primary}
                  onBlur={e => e.target.style.borderColor = D.border}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: D.muted }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ ...selectStyle, width: 'auto', minWidth: 160 }}>
                <option value="nombre">Ordenar por nombre</option>
                <option value="rating">Mejor calificados</option>
                <option value="productos">Más productos</option>
                <option value="experiencia">Más experiencia</option>
              </select>

              {/* Filters button */}
              <button onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, border: `1px solid ${hasActiveFilters ? D.primary : D.border}`, background: hasActiveFilters ? `rgba(34,197,94,0.1)` : 'rgba(34,197,94,0.04)', color: hasActiveFilters ? D.primary : D.muted, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <Filter size={16} />
                Filtros
                {hasActiveFilters && (
                  <span style={{ background: D.primary, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {[selectedSpecialty, selectedRating, selectedAvailability].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Mapa button */}
              <button onClick={() => navigate('/dashboard-consumidor/mapa-productores')}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: `1px solid rgba(34,197,94,0.35)`, background: 'rgba(34,197,94,0.08)', color: D.primary, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <MapPin size={15} /> Ver mapa
              </button>
            </div>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 16, padding: 20, background: 'rgba(34,197,94,0.04)', borderRadius: 14, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
                  {[
                    { label: 'Especialidad', value: selectedSpecialty, onChange: setSelectedSpecialty, options: [['', 'Todas las especialidades'], ...especialidades.map(e => [e, e])] },
                    { label: 'Calificación mínima', value: selectedRating, onChange: setSelectedRating, options: [['','Cualquier calificación'],['4','4+ estrellas'],['3.5','3.5+ estrellas'],['3','3+ estrellas']] },
                    { label: 'Disponibilidad', value: selectedAvailability, onChange: setSelectedAvailability, options: [['','Todos'],['available','Disponibles hoy'],['unavailable','No disponibles']] },
                  ].map(({ label, value, onChange, options }) => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 6 }}>{label}</label>
                      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {hasActiveFilters && (
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={clearFilters}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: `rgba(${D.red === '#f87171' ? '248,113,113' : '220,38,38'},0.1)`, color: D.red, border: `1px solid ${D.red}30`, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      <X size={14} /> Limpiar filtros
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Stats + Cards ── */}
      <motion.div style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { icon: Users, label: 'Productores Activos', value: stats.total, color: D.primary, glow: 'rgba(34,197,94,0.15)' },
            { icon: Clock, label: 'Disponibles Hoy', value: stats.disponibles, color: D.teal, glow: 'rgba(20,184,166,0.15)' },
            { icon: Package, label: 'Productos Totales', value: stats.productos, color: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
            { icon: Star, label: 'Calificación Promedio', value: stats.rating.toFixed(1), color: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
          ].map(({ icon: Icon, label, value, color, glow }) => (
            <div key={label} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ padding: 12, borderRadius: 12, background: glow, flexShrink: 0 }}>
                <Icon style={{ color }} size={22} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: D.muted, margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: 0 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredAndSortedProductores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 16 }}>
            <Fish style={{ width: 64, height: 64, color: D.dim, margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>No se encontraron productores</h3>
            <p style={{ color: D.muted, marginBottom: 16 }}>
              {hasActiveFilters ? "Intenta ajustar los filtros" : "No hay productores disponibles en este momento"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Producer cards */}
        {filteredAndSortedProductores.length > 0 && (() => {
          const totalPages = Math.ceil(filteredAndSortedProductores.length / PAGE_SIZE)
          const paged = filteredAndSortedProductores.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
          return (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {paged.map((productor, index) => {
              const iniciales = (productor.nombre || "P")
                .split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
              const gradients = [
                { from: "#3B82F6", to: "#06B6D4" },
                { from: "#22C55E", to: "#14B8A6" },
                { from: "#6366F1", to: "#3B82F6" },
                { from: "#06B6D4", to: "#22C55E" },
                { from: "#8B5CF6", to: "#6366F1" },
              ]
              const grad = gradients[index % gradients.length]

              return (
                <motion.div key={productor.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -5, boxShadow: `0 20px 40px rgba(0,0,0,0.35), 0 0 0 1px ${D.border}` }}
                  onClick={() => handleProductorClick(productor.id)}
                  style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s' }}>
                  {/* Gradient header */}
                  <div style={{ background: `linear-gradient(135deg,${grad.from},${grad.to})`, padding: '20px 20px 28px', position: 'relative' }}>
                    {productor.is_available_today && (
                      <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)' }}>
                        ● Disponible hoy
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {productor.foto_perfil
                          ? <img src={productor.foto_perfil} alt={productor.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                          : null}
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, display: productor.foto_perfil ? 'none' : 'flex' }}>{iniciales}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 15, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productor.nombre || "Productor"}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productor.nombre_empresa || productor.especialidad || "Productor acuícola"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 20px 20px' }}>
                    <p style={{ fontSize: 13, color: D.muted, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>
                      {productor.descripcion || "Productor acuícola especializado en productos frescos y de calidad certificada."}
                    </p>

                    {/* Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: D.muted, background: `rgba(34,197,94,0.08)`, border: `1px solid ${D.border}`, padding: '3px 8px', borderRadius: 20 }}>
                        <MapPin size={9} /> {productor.ciudad || "Bolivia"}
                      </span>
                      {productor.especialidad && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, background: `${grad.from}20`, color: grad.from, padding: '3px 8px', borderRadius: 20 }}>
                          <Fish size={9} /> {productor.especialidad}
                        </span>
                      )}
                      {productor.years_experience > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '3px 8px', borderRadius: 20 }}>
                          <Award size={9} /> {productor.years_experience} años
                        </span>
                      )}
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 14, borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}`, padding: '10px 0' }}>
                      {[
                        { val: productor.productos_count || 0, label: 'Productos' },
                        { val: productor.rating > 0 ? productor.rating.toFixed(1) : '—', label: `${productor.total_reviews || 0} reseñas`, star: true },
                        { val: productor.years_experience > 0 ? productor.years_experience : '—', label: 'Años exp.' },
                      ].map(({ val, label, star }, i) => (
                        <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? `1px solid ${D.border}` : 'none' }}>
                          {star
                            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}><Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} /><span style={{ fontSize: 18, fontWeight: 800, color: D.text }}>{val}</span></div>
                            : <p style={{ fontSize: 18, fontWeight: 800, color: D.text, margin: 0 }}>{val}</p>}
                          <p style={{ fontSize: 11, color: D.muted, margin: '2px 0 0' }}>{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: `linear-gradient(135deg,${grad.from},${grad.to})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'opacity 0.2s' }}
                      onClick={e => { e.stopPropagation(); handleProductorClick(productor.id) }}
                      onMouseEnter={e => e.target.style.opacity = '0.88'}
                      onMouseLeave={e => e.target.style.opacity = '1'}>
                      Ver perfil completo
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${D.border}`, background: currentPage === 1 ? 'transparent' : `rgba(34,197,94,0.08)`, color: currentPage === 1 ? D.dim : D.primary, cursor: currentPage === 1 ? 'default' : 'pointer', fontWeight: 600, fontSize: 13 }}>
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${p === currentPage ? D.primary : D.border}`, background: p === currentPage ? `linear-gradient(135deg,${D.primary},${D.teal})` : 'transparent', color: p === currentPage ? '#fff' : D.muted, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${D.border}`, background: currentPage === totalPages ? 'transparent' : `rgba(34,197,94,0.08)`, color: currentPage === totalPages ? D.dim : D.primary, cursor: currentPage === totalPages ? 'default' : 'pointer', fontWeight: 600, fontSize: 13 }}>
                Siguiente →
              </button>
            </div>
          )}
          </>
          )
        })()}
      </motion.div>
    </div>
  )
}

export default Productores