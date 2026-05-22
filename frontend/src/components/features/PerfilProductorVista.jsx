import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, MapPin, Phone, Mail, Clock, Calendar, ShoppingCart,
  Star, Check, Truck, Store, Award, Users, Globe, Facebook,
  Instagram, Twitter, Plus, Package, Fish,
  ShieldCheck, Timer, ChefHat, CheckCircle, Heart,
  MessageSquare, Send, Loader, ChevronLeft, ChevronRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/config/axios"
import { API_ENDPOINTS } from "../../config/apiConfig"
import {
  agregarAlCarrito as agregarAlCarritoService,
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
} from "../../api/services/carrito.service"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"

const CATEGORIAS_GALERIA = [
  { id: "general",      label: "Criadero",    icono: "🏞️" },
  { id: "alimentacion", label: "Alimentación", icono: "🐟" },
  { id: "captura",      label: "Captura",      icono: "🎣" },
  { id: "preparacion",  label: "Preparación",  icono: "🔪" },
]

// ── Modal de detalle de producto ─────────────────────────────────────────────
const ProductoModal = ({ producto, onClose, onCarritoUpdate }) => {
  const { D, isDark } = useTheme()
  const [qty, setQty]           = useState(1)
  const [agregando, setAgregando] = useState(false)
  const [ok, setOk]             = useState(false)

  const agotado = !producto.disponible || !producto.stock || producto.stock <= 0
  const esPorKg = ["kg", "Kg", "KG"].includes(producto.unidad)

  const add = async () => {
    if (agotado || agregando) return
    try {
      setAgregando(true)
      await agregarAlCarritoService(producto.id, qty)
      setOk(true)
      onCarritoUpdate?.()
      setTimeout(() => { setOk(false); onClose() }, 1400)
    } catch {
      alert("❌ Error al agregar al carrito")
    } finally {
      setAgregando(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ background: isDark ? "#0a1220" : D.card, border: `1px solid ${D.border}`, borderRadius: 24, overflow: "hidden", maxWidth: 520, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
      >
        {/* imagen */}
        <div style={{ position: "relative", height: 280, background: "rgba(56,189,248,0.04)" }}>
          {producto.imagen
            ? <img src={producto.imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Fish size={64} style={{ color: "rgba(56,189,248,0.18)" }} />
              </div>
          }
          {/* cerrar */}
          <button onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>
            ✕
          </button>
          {agotado && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.42)" }}>
              <span style={{ padding: "8px 22px", borderRadius: 20, background: "rgba(239,68,68,0.82)", color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>Agotado</span>
            </div>
          )}
          <AnimatePresence>
            {ok && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(74,222,128,0.2)", gap: 10 }}>
                <CheckCircle size={52} color="#4ade80" />
                <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 16 }}>¡Agregado al carrito!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* info */}
        <div style={{ padding: "22px 24px 26px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: 0, lineHeight: 1.3 }}>{producto.nombre}</h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
              <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                background: agotado ? "rgba(248,113,113,0.14)" : "rgba(74,222,128,0.14)",
                color: agotado ? "#f87171" : "#4ade80" }}>
                {agotado ? "Sin stock" : `${producto.stock} ${producto.unidad || "kg"} disponibles`}
              </span>
              {esPorKg && !agotado && (
                <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: "rgba(251,146,60,0.14)", color: "#fb923c" }}>
                  ⚖ por kilo · mín. 800g
                </span>
              )}
            </div>
          </div>

          {producto.descripcion && (
            <p style={{ fontSize: 13, color: D.muted, lineHeight: 1.7, margin: "0 0 18px" }}>{producto.descripcion}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 30, fontWeight: 900, color: agotado ? D.dim : D.primary }}>
                Bs {Number(producto.precio).toFixed(2)}
              </span>
              {producto.unidad && <span style={{ fontSize: 13, color: D.muted, marginLeft: 6 }}>/ {producto.unidad}</span>}
            </div>

            {!agotado && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* qty */}
                <div style={{ display: "flex", alignItems: "center", borderRadius: 12, border: `1px solid ${D.border}`, overflow: "hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: D.muted, cursor: "pointer", fontSize: 20, fontWeight: 500 }}>−</button>
                  <span style={{ width: 34, textAlign: "center", fontSize: 15, fontWeight: 700, color: D.text }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: D.muted, cursor: "pointer", fontSize: 20, fontWeight: 500 }}>+</button>
                </div>
                {/* agregar */}
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={add} disabled={agregando}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, background: `linear-gradient(135deg,${D.primary},#0369a1)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: agregando ? 0.7 : 1, boxShadow: "0 0 20px rgba(56,189,248,0.28)", whiteSpace: "nowrap" }}>
                  {agregando
                    ? <div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                    : <ShoppingCart size={15} />}
                  Agregar
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Mini card para el grid de productos ──────────────────────────────────────
const ProductoCard = ({ producto, onCarritoUpdate }) => {
  const { D, isDark } = useTheme()
  const [agregando, setAgregando] = useState(false)
  const [ok, setOk]               = useState(false)
  const [showModal, setShowModal] = useState(false)

  const agotado = !producto.disponible || !producto.stock || producto.stock <= 0
  const esPorKg = ["kg", "Kg", "KG"].includes(producto.unidad)

  const add = async (e) => {
    e.stopPropagation()
    if (agotado || agregando) return
    try {
      setAgregando(true)
      await agregarAlCarritoService(producto.id, 1)
      setOk(true)
      setTimeout(() => setOk(false), 2000)
      onCarritoUpdate?.()
    } catch {
      alert("❌ Error al agregar al carrito")
    } finally {
      setAgregando(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowModal(true)}
        whileHover={{ y: -5, boxShadow: "0 14px 36px rgba(56,189,248,0.13)" }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
          background: isDark ? "rgba(13,20,40,0.97)" : D.surface,
          border: "1px solid rgba(56,189,248,0.1)",
          opacity: agotado ? 0.75 : 1,
          transition: "border-color 0.2s",
        }}
        onHoverStart={e => { e.target.style && (e.target.style.borderColor = "rgba(56,189,248,0.35)") }}
      >
        {/* imagen cuadrada */}
        <div style={{ aspectRatio: "1/1", background: "rgba(56,189,248,0.04)", position: "relative", overflow: "hidden" }}>
          {producto.imagen
            ? <img src={producto.imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Fish size={36} style={{ color: "rgba(56,189,248,0.22)" }} />
              </div>
          }
          {/* overlay éxito */}
          <AnimatePresence>
            {ok && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(74,222,128,0.2)" }}>
                <CheckCircle size={34} color="#4ade80" />
              </motion.div>
            )}
          </AnimatePresence>
          {/* agotado overlay */}
          {agotado && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.38)" }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(239,68,68,0.78)", color: "#fff", fontSize: 10, fontWeight: 800 }}>Agotado</span>
            </div>
          )}
          {/* badge kilo */}
          {esPorKg && !agotado && (
            <div style={{ position: "absolute", bottom: 7, left: 7, padding: "2px 7px", borderRadius: 8, fontSize: 9, fontWeight: 700, background: "rgba(251,146,60,0.22)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.4)" }}>
              ⚖ x kilo
            </div>
          )}
        </div>

        {/* info */}
        <div style={{ padding: "10px 12px 12px" }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: D.text, margin: "0 0 7px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {producto.nombre}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 15, color: agotado ? D.dim : D.primary }}>
                Bs {Number(producto.precio).toFixed(2)}
              </span>
              {producto.unidad && <span style={{ fontSize: 10, color: D.muted, marginLeft: 3 }}>/{producto.unidad}</span>}
            </div>
            <motion.button
              whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
              onClick={add} disabled={agotado || agregando}
              style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: agotado ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg,${D.primary},#0369a1)`,
                boxShadow: agotado ? "none" : "0 0 10px rgba(56,189,248,0.28)", border: "none", cursor: agotado ? "default" : "pointer" }}>
              {agregando
                ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                : <ShoppingCart size={14} color={agotado ? D.dim : "#fff"} />}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ProductoModal producto={producto} onClose={() => setShowModal(false)} onCarritoUpdate={onCarritoUpdate} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
const PerfilProductorVista = ({ productorId, onBack }) => {
  const { D, isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [productor, setProductor]   = useState(null)
  const [productos, setProductos]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState("productos")
  const [cartItems, setCartItems]   = useState([])
  const [cartCount, setCartCount]   = useState(0)
  const [cartTotal, setCartTotal]   = useState(0)
  const [reviews, setReviews]       = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [reviewForm, setReviewForm] = useState({ producto_id: "", calificacion: 0, comentario: "" })
  const [submitting, setSubmitting] = useState(false)
  const [reviewErr, setReviewErr]   = useState(null)
  const [reviewOk, setReviewOk]     = useState(null)
  const [galeriaTab, setGaleriaTab] = useState("general")
  const [calCursor, setCalCursor]   = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1) })
  const [calDias, setCalDias]       = useState([])
  const [calLoading, setCalLoading] = useState(false)

  // carga inicial
  useEffect(() => {
    if (!productorId) return
    const load = async () => {
      try {
        setLoading(true)
        const [pRes, prRes] = await Promise.all([
          api.get(API_ENDPOINTS.PRODUCTORES.BY_ID(productorId)),
          api.get(`${API_ENDPOINTS.PRODUCTORES.BY_ID(productorId)}/productos`),
        ])

        // El backend envuelve la respuesta como { success, data }. Desenvolver.
        const prod      = pRes.data?.data ?? pRes.data ?? null
        const prodsRaw  = prRes.data?.data ?? prRes.data ?? []

        // Algunos campos JSONB pueden llegar como string/objeto: forzar a array
        const parseArr = (v) => {
          if (Array.isArray(v)) return v
          if (v && typeof v === 'object') return []
          if (typeof v === 'string') {
            try { const x = JSON.parse(v); return Array.isArray(x) ? x : [] }
            catch { return v.split(',').map(s => s.trim()).filter(Boolean) }
          }
          return []
        }
        if (prod) {
          prod.certificaciones  = parseArr(prod.certificaciones)
          prod.metodos_envio    = parseArr(prod.metodos_envio)
          prod.galeria_criadero = parseArr(prod.galeria_criadero)
          // especialidad se renderiza con .split(","): si viene como array, unir
          if (Array.isArray(prod.especialidad)) prod.especialidad = prod.especialidad.join(', ')
        }
        setProductor(prod)
        setProductos(Array.isArray(prodsRaw) ? prodsRaw : [])
        await loadCart()
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [productorId])

  // reseñas al cambiar de tab
  useEffect(() => {
    if (tab !== "resenas" || !productorId) return
    const load = async () => {
      setLoadingReviews(true)
      try {
        const r = await api.get(API_ENDPOINTS.OPINIONES.POR_PRODUCTOR(productorId))
        setReviews(r.data?.data ?? r.data ?? [])
      } catch { setReviews([]) }
      finally { setLoadingReviews(false) }
    }
    load()
  }, [tab, productorId])

  // calendario
  useEffect(() => {
    if (!productorId) return
    const load = async () => {
      setCalLoading(true)
      try {
        const desde = new Date(calCursor); desde.setDate(1)
        const dow = (desde.getDay() + 6) % 7; desde.setDate(desde.getDate() - dow)
        const hasta = new Date(desde); hasta.setDate(hasta.getDate() + 41)
        const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
        const r = await api.get(`/productores/${productorId}/calendario`, { params: { desde: ymd(desde), hasta: ymd(hasta) } })
        setCalDias(r.data?.data || [])
      } catch { setCalDias([]) }
      finally { setCalLoading(false) }
    }
    load()
  }, [productorId, calCursor])

  const loadCart = async () => {
    try {
      const d = await obtenerCarrito()
      const items = d?.items || []
      setCartItems(items)
      setCartCount(items.reduce((s, i) => s + i.cantidad, 0))
      setCartTotal(items.reduce((s, i) => s + i.precio * i.cantidad, 0))
    } catch { setCartItems([]); setCartCount(0); setCartTotal(0) }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.calificacion) { setReviewErr("Selecciona una calificación"); return }
    if (!reviewForm.producto_id)  { setReviewErr("Selecciona un producto"); return }
    setSubmitting(true); setReviewErr(null)
    try {
      await api.post(API_ENDPOINTS.OPINIONES.CREAR, reviewForm)
      setReviewOk("¡Reseña publicada!")
      setReviewForm({ producto_id: "", calificacion: 0, comentario: "" })
      const r = await api.get(API_ENDPOINTS.OPINIONES.POR_PRODUCTOR(productorId))
      setReviews(r.data?.data ?? r.data ?? [])
      setTimeout(() => setReviewOk(null), 3000)
    } catch (err) { setReviewErr(err.response?.data?.message || "Error al publicar reseña") }
    finally { setSubmitting(false) }
  }

  const handleCall     = () => { if (productor?.telefono) window.open(`tel:${productor.telefono}`) }
  const handleWhatsApp = () => { if (productor?.telefono) window.open(`https://wa.me/591${productor.telefono.replace(/\D/g,"")}`) }
  const handleEmail    = () => { if (productor?.email) window.open(`mailto:${productor.email}`) }
  const handleChat     = () => navigate("/dashboard-consumidor/mensajes")

  const esDia = (obj, key) => (obj || {})[key] === true || (obj || {})[key] === 1
  const dias   = [
    { key:"lunes",label:"L" },{ key:"martes",label:"M" },{ key:"miercoles",label:"M" },
    { key:"jueves",label:"J" },{ key:"viernes",label:"V" },{ key:"sabado",label:"S" },{ key:"domingo",label:"D" },
  ]
  const calYmd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
  const calHoy = calYmd(new Date())
  const calMap = new Map(calDias.map(d => [d.fecha, d]))

  const galeriaCats  = CATEGORIAS_GALERIA.filter(c => (productor?.galeria_criadero || []).some(i => (i.categoria || "general") === c.id))
  const galeriaItems = (productor?.galeria_criadero || []).filter(i => (i.categoria || "general") === galeriaTab)

  const stats = [
    { icon: Timer,      v: `${productor?.years_experience || 5}+`, label: "Años exp.",  color: D.primary },
    { icon: Package,    v: productos.length,                        label: "Productos",  color: "#4ade80"  },
    { icon: Users,      v: `${productor?.clientes || 50}+`,         label: "Clientes",   color: "#c084fc"  },
    { icon: ShieldCheck,v: "100%",                                  label: "Satisfacc.", color: "#fb923c"  },
  ]

  const tabs = [
    { key:"productos",   label:"Productos",  icon:Package },
    { key:"carrito",     label:"Carrito",    icon:ShoppingCart, badge: cartCount || null },
    { key:"resenas",     label:"Reseñas",    icon:Star,         badge: reviews.length || null },
    { key:"informacion", label:"Info",       icon:Users },
  ]

  // ── helpers de estilo ─────────────────────────────────────────────────────
  const card = { background: isDark ? "rgba(13,20,40,0.97)" : D.surface, border: `1px solid ${D.border}`, borderRadius: 20, overflow: "hidden" }
  const sideCard = (accentColor) => ({
    ...card, border: `1px solid ${accentColor}30`,
  })

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, background:D.bg }}>
      <div style={{ position:"relative", width:56, height:56 }}>
        <div style={{ width:56, height:56, borderRadius:"50%", border:`3px solid ${D.border}`, borderTopColor:D.primary, animation:"spin 0.8s linear infinite" }} />
        <Fish size={20} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", color:D.primary }} />
      </div>
      <p style={{ color:D.muted, fontSize:13 }}>Cargando perfil…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!productor) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, background:D.bg }}>
      <p style={{ color:D.muted }}>No se encontró el productor</p>
      <button onClick={onBack} style={{ color:D.primary, cursor:"pointer", background:"none", border:"none", fontSize:14, textDecoration:"underline" }}>Volver</button>
    </div>
  )

  const initials = productor.nombre?.charAt(0)?.toUpperCase() || "P"

  return (
    <div style={{ minHeight:"100%", background:D.bg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"24px 20px" }}>

        {/* Volver */}
        <motion.button initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
          onClick={onBack}
          style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:D.muted, background:"none", border:"none", cursor:"pointer", marginBottom:24 }}
          onMouseEnter={e => e.currentTarget.style.color = D.primary}
          onMouseLeave={e => e.currentTarget.style.color = D.muted}>
          <ArrowLeft size={17} /> Volver a productores
        </motion.button>

        {/* Botón carrito flotante */}
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.button initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
              whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              onClick={() => { window.dispatchEvent(new CustomEvent("carritoActualizado")); navigate("/dashboard-consumidor/carrito") }}
              style={{ position:"fixed", bottom:28, right:28, zIndex:50, width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#0ea5e9,#0369a1)", boxShadow:"0 0 28px rgba(56,189,248,0.45)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ShoppingCart size={22} color="#fff" />
              <span style={{ position:"absolute", top:-6, right:-6, width:22, height:22, borderRadius:"50%", background:"#ef4444", color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 8px rgba(239,68,68,0.5)" }}>
                {cartCount}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ═══════════════════════ HERO ═══════════════════════════════════ */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          style={{ borderRadius:24, overflow:"hidden", marginBottom:24, border:`1px solid ${D.border}`, background: isDark ? "rgba(10,18,38,0.98)" : D.card }}>

          {/* Banner */}
          <div style={{ height:200, position:"relative", background:"linear-gradient(135deg,#0a1428,#061230,#080e24)", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-40, right:-40, width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.14),transparent)", filter:"blur(50px)" }} />
            <div style={{ position:"absolute", bottom:-20, left:-20, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(20,184,166,0.12),transparent)", filter:"blur(40px)" }} />
            <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"repeating-linear-gradient(0deg,rgba(56,189,248,1) 0,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(56,189,248,1) 0,transparent 1px,transparent 48px)" }} />
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#38bdf8,#14b8a6,transparent)" }} />
            {productor.foto_portada && (
              <img src={productor.foto_portada} alt="portada" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.35 }} />
            )}
            <div style={{ position:"absolute", bottom:14, left:20, display:"flex", alignItems:"center", gap:7, color:"rgba(56,189,248,0.75)", fontSize:13, fontWeight:500 }}>
              <Fish size={16} /> Productor de Acuicultura
            </div>
          </div>

          {/* Perfil info */}
          <div style={{ padding:"0 28px 28px", marginTop:-56, position:"relative" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:20, alignItems:"flex-end" }}>
                {/* Avatar */}
                <div style={{ position:"relative", flexShrink:0, zIndex:10 }}>
                  <div style={{ width:120, height:120, borderRadius:"50%", padding:3, background:"linear-gradient(135deg,#38bdf8,#14b8a6)", boxShadow:"0 0 28px rgba(56,189,248,0.4)" }}>
                    <div style={{ width:"100%", height:"100%", borderRadius:"50%", overflow:"hidden", background: isDark ? "#0f172a" : D.surface, border: `3px solid ${isDark ? "#0f172a" : D.surface}` }}>
                      {productor.foto_perfil
                        ? <img src={productor.foto_perfil} alt={productor.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(20,184,166,0.15))" }}>
                            <span style={{ fontSize:40, fontWeight:800, color:D.primary }}>{initials}</span>
                          </div>
                      }
                    </div>
                  </div>
                  {productor.is_available_today && (
                    <div style={{ position:"absolute", bottom:5, right:5, width:20, height:20, borderRadius:"50%", background:"#4ade80", border:`3px solid ${isDark ? "#0f172a" : D.surface}`, boxShadow:"0 0 10px rgba(74,222,128,0.7)" }} />
                  )}
                </div>

                {/* Nombre + datos */}
                <div style={{ flex:1, minWidth:200, paddingTop:60 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                    <div>
                      <h1 style={{ fontSize:28, fontWeight:800, color:D.text, margin:0 }}>{productor.nombre}</h1>
                      {productor.nombre_empresa && productor.nombre_empresa !== "no hay" && (
                        <p style={{ fontSize:15, color:D.primary, margin:"4px 0 0", fontWeight:500 }}>{productor.nombre_empresa}</p>
                      )}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:8 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:D.muted }}>
                          <MapPin size={13} style={{ color:D.primary }} />
                          {productor.ciudad || productor.ubicacion || "Bolivia"}
                        </span>
                        {productor.rating > 0 && (
                          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:13 }}>
                            <Star size={13} style={{ color:"#fbbf24", fill:"#fbbf24" }} />
                            <span style={{ fontWeight:700, color:D.text }}>{Number(productor.rating).toFixed(1)}</span>
                            <span style={{ color:D.muted }}>({productor.total_reviews || 0})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Certs */}
                    {productor.certificaciones?.length > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {productor.certificaciones.map((c,i) => (
                          <span key={i} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:"rgba(74,222,128,0.12)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.28)" }}>
                            <Award size={11} />{typeof c === "object" ? c.nombre : c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {productor.descripcion && (
                    <p style={{ marginTop:12, fontSize:13, color:D.muted, lineHeight:1.65, maxWidth:560 }}>{productor.descripcion}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {stats.map(({ icon:Icon, v, label, color }) => (
                  <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 8px", borderRadius:14, background:`${color}10`, border:`1px solid ${color}22` }}>
                    <Icon size={18} style={{ color, marginBottom:4 }} />
                    <span style={{ fontSize:20, fontWeight:800, color }}>{v}</span>
                    <span style={{ fontSize:11, color:D.muted, textAlign:"center" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Pills */}
              {(productor.vende_cocinado || productor.is_available_today) && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {productor.vende_cocinado && (
                    <span style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, background:"rgba(251,146,60,0.12)", color:"#fb923c", border:"1px solid rgba(251,146,60,0.28)" }}>
                      <ChefHat size={13} />Vende comida cocinada
                    </span>
                  )}
                  {productor.is_available_today && (
                    <span style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, background:"rgba(74,222,128,0.12)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.28)" }}>
                      <Check size={13} />Disponible hoy
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════ DOS COLUMNAS ═══════════════════════════════ */}
        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20, alignItems:"start" }}>

          {/* ─── SIDEBAR IZQUIERDO ──────────────────────────────────────── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Horario */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.18 }}
              style={{ ...sideCard("#14b8a6"), borderTopWidth:2, borderTopColor:"#14b8a6" }}>
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:"rgba(20,184,166,0.15)", border:"1px solid rgba(20,184,166,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Clock size={15} color="#14b8a6" />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:D.muted }}>Horario de atención</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, background:"rgba(20,184,166,0.08)", border:"1px solid rgba(20,184,166,0.2)", marginBottom:12 }}>
                  <Clock size={14} color="#14b8a6" />
                  <span style={{ fontWeight:700, fontSize:14, color:"#14b8a6" }}>
                    {productor.horario_atencion_inicio || "08:00"} – {productor.horario_atencion_fin || "18:00"}
                  </span>
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  {dias.map(d => {
                    const on = esDia(productor.dias_venta, d.key)
                    return (
                      <div key={d.key} style={{ flex:1, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                        background: on ? "rgba(56,189,248,0.18)" : isDark ? "rgba(255,255,255,0.04)" : D.bg,
                        color:      on ? D.primary : D.dim,
                        border:     on ? "1px solid rgba(56,189,248,0.38)" : `1px solid ${D.border}` }}>
                        {d.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Contacto */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.22 }}
              style={{ ...sideCard("#38bdf8"), borderTopWidth:2, borderTopColor:"#38bdf8" }}>
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:"rgba(56,189,248,0.12)", border:"1px solid rgba(56,189,248,0.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Phone size={15} color={D.primary} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:D.muted }}>Contacto</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  {[
                    { label:"Llamar",   fn:handleCall,     color:D.primary,  bg:"rgba(56,189,248,0.08)",  bd:"rgba(56,189,248,0.28)",  icon:<Phone size={18} color={D.primary} /> },
                    { label:"WhatsApp", fn:handleWhatsApp, color:"#25d366",  bg:"rgba(37,211,102,0.08)", bd:"rgba(37,211,102,0.28)",  icon:<svg viewBox="0 0 24 24" width="18" height="18" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.852L.057 23.527a.75.75 0 0 0 .916.917l5.733-1.48A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.856 0-3.596-.5-5.088-1.372l-.364-.217-3.764.97.998-3.68-.237-.381A9.937 9.937 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> },
                    { label:"Email",    fn:handleEmail,    color:"#14b8a6",  bg:"rgba(20,184,166,0.08)",  bd:"rgba(20,184,166,0.28)",  icon:<Mail size={18} color="#14b8a6" /> },
                    { label:"Chat",     fn:handleChat,     color:"#818cf8",  bg:"rgba(129,140,248,0.08)", bd:"rgba(129,140,248,0.28)", icon:<MessageSquare size={18} color="#818cf8" /> },
                  ].map(({ label, fn, color, bg, bd, icon }) => (
                    <motion.button key={label} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      onClick={fn}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"12px 8px", borderRadius:12, background:bg, border:`1px solid ${bd}`, cursor:"pointer" }}>
                      {icon}
                      <span style={{ fontSize:11, fontWeight:700, color }}>{label}</span>
                    </motion.button>
                  ))}
                </div>
                {(productor.telefono || productor.email) && (
                  <div style={{ paddingTop:10, borderTop:`1px solid ${D.border}`, display:"flex", flexDirection:"column", gap:5 }}>
                    {productor.telefono && (
                      <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:D.muted }}>
                        <Phone size={10} color={D.dim} />{productor.telefono}
                      </span>
                    )}
                    {productor.email && (
                      <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:D.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        <Mail size={10} color={D.dim} />{productor.email}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Calendario */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.26 }}
              style={{ ...sideCard("#22c55e"), borderTopWidth:2, borderTopColor:"#22c55e" }}>
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:9, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Calendar size={15} color="#22c55e" />
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:D.muted }}>Disponibilidad</span>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {[
                      { onClick:()=>setCalCursor(c=>new Date(c.getFullYear(),c.getMonth()-1,1)), icon:<ChevronLeft size={12}/> },
                      { onClick:()=>setCalCursor(c=>new Date(c.getFullYear(),c.getMonth()+1,1)), icon:<ChevronRight size={12}/> },
                    ].map((b,i) => (
                      <button key={i} onClick={b.onClick}
                        style={{ width:24, height:24, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", background: isDark ? "rgba(255,255,255,0.05)" : D.bg, border:`1px solid ${D.border}`, color:D.muted, cursor:"pointer" }}>
                        {b.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <p style={{ textAlign:"center", fontSize:12, fontWeight:700, color:D.text, marginBottom:10, textTransform:"capitalize" }}>
                  {calCursor.toLocaleDateString("es-BO", { month:"long", year:"numeric" })}
                </p>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
                  {["L","M","X","J","V","S","D"].map(l => (
                    <div key={l} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:D.dim }}>{l}</div>
                  ))}
                </div>

                {calLoading ? (
                  <div style={{ display:"flex", justifyContent:"center", padding:"16px 0" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", border:"2px solid rgba(34,197,94,0.3)", borderTopColor:"#22c55e", animation:"spin 0.7s linear infinite" }} />
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                    {(() => {
                      const desde = new Date(calCursor); desde.setDate(1)
                      desde.setDate(desde.getDate() - ((desde.getDay()+6)%7))
                      return Array.from({ length:42 }, (_,i) => {
                        const dt = new Date(desde); dt.setDate(desde.getDate()+i)
                        const fecha = calYmd(dt)
                        const enMes = dt.getMonth() === calCursor.getMonth()
                        const d = calMap.get(fecha)
                        const libre = d?.disponible === true
                        const pasado = fecha < calHoy
                        const hoy = fecha === calHoy
                        let bg = "transparent", fg = D.dim, bd = "transparent"
                        if (libre && !pasado)   { bg = "rgba(34,197,94,0.18)"; fg = "#22c55e"; bd = "rgba(34,197,94,0.4)" }
                        else if (d && !libre)   { bg = "rgba(239,68,68,0.12)"; fg = "#ef4444"; bd = "rgba(239,68,68,0.3)" }
                        if (hoy)                { bd = D.primary }
                        return (
                          <div key={fecha} style={{ opacity: enMes ? (pasado ? 0.38 : 1) : 0.18 }}>
                            <div style={{ borderRadius:6, background:bg, border:`1px solid ${bd}`, aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center", cursor:"default" }}>
                              <span style={{ color:fg, fontSize:10, fontWeight: hoy ? 800 : 500 }}>{dt.getDate()}</span>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}

                <div style={{ display:"flex", gap:12, marginTop:10, justifyContent:"center" }}>
                  {[["rgba(34,197,94,0.45)","Disponible"],["rgba(239,68,68,0.45)","No disponible"]].map(([bg,label]) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:9, height:9, borderRadius:2, background:bg }} />
                      <span style={{ fontSize:9, color:D.dim }}>{label}</span>
                    </div>
                  ))}
                </div>
                <p style={{ textAlign:"center", fontSize:9, color:D.dim, marginTop:8, marginBottom:0, opacity:0.75 }}>
                  Contacta al productor para coordinar entregas
                </p>
              </div>
            </motion.div>

          </div>{/* fin sidebar */}

          {/* ─── CONTENIDO PRINCIPAL ────────────────────────────────────── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Galería */}
            {galeriaCats.length > 0 && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
                style={{ ...card, borderTopWidth:2, borderTopColor:"#818cf8" }}>
                <div style={{ padding:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <div style={{ width:30, height:30, borderRadius:9, background:"rgba(129,140,248,0.12)", border:"1px solid rgba(129,140,248,0.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🏞️</div>
                    <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:D.muted }}>Galería del criadero</span>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                    {galeriaCats.map(cat => (
                      <button key={cat.id} onClick={() => setGaleriaTab(cat.id)}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                          background: galeriaTab===cat.id ? "rgba(56,189,248,0.18)" : isDark ? "rgba(255,255,255,0.05)" : D.bg,
                          color:      galeriaTab===cat.id ? D.primary : D.muted,
                          border:     galeriaTab===cat.id ? "1px solid rgba(56,189,248,0.4)" : `1px solid ${D.border}` }}>
                        {cat.icono} {cat.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:6 }}>
                    {galeriaItems.length === 0
                      ? <p style={{ color:D.dim, fontSize:13, padding:"24px 0" }}>Sin contenido en esta sección</p>
                      : galeriaItems.map((item,i) => (
                          <div key={i} style={{ flexShrink:0, width:180, height:160, borderRadius:14, overflow:"hidden", position:"relative" }}>
                            <img src={item.url} alt={item.titulo||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            {item.titulo && (
                              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"4px 8px", background:"rgba(0,0,0,0.6)", fontSize:11, color:"#fff", fontWeight:600 }}>{item.titulo}</div>
                            )}
                          </div>
                        ))
                    }
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
              style={{ ...card, flex:1 }}>

              {/* Barra de tabs */}
              <div style={{ display:"flex", borderBottom:`1px solid ${D.border}` }}>
                {tabs.map(({ key, label, icon:Icon, badge }) => {
                  const on = tab === key
                  return (
                    <button key={key} onClick={() => setTab(key)}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"14px 8px", fontSize:13, fontWeight:600, cursor:"pointer", position:"relative", background: on ? "rgba(56,189,248,0.05)" : "transparent", border:"none",
                        color: on ? D.primary : D.muted }}>
                      <Icon size={15} />
                      {label}
                      {badge ? (
                        <span style={{ width:18, height:18, borderRadius:"50%", background:"#ef4444", color:"#fff", fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{badge}</span>
                      ) : null}
                      {on && (
                        <motion.div layoutId="tabLine"
                          style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${D.primary},transparent)` }} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Contenido tabs */}
              <div style={{ padding:20 }}>

                {/* ── PRODUCTOS ─────────────────────────────────────────── */}
                {tab === "productos" && (
                  <>
                    {productos.some(p => ["kg","Kg","KG"].includes(p.unidad)) && (
                      <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 14px", borderRadius:12, background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.22)", marginBottom:16 }}>
                        <Package size={13} style={{ color:"#fb923c", flexShrink:0, marginTop:1 }} />
                        <p style={{ fontSize:12, color:"#fb923c", margin:0, lineHeight:1.6 }}>
                          Productos por kilo se venden desde 800g. El precio puede variar según el peso exacto.
                        </p>
                      </div>
                    )}
                    {productos.length === 0
                      ? (
                        <div style={{ textAlign:"center", padding:"56px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                          <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(56,189,248,0.07)", border:"1px solid rgba(56,189,248,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Store size={24} style={{ color:"rgba(56,189,248,0.4)" }} />
                          </div>
                          <p style={{ color:D.muted, fontSize:14 }}>Este productor aún no tiene productos disponibles</p>
                        </div>
                      ) : (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14 }}>
                          {[...productos]
                            .sort((a,b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0))
                            .map(p => <ProductoCard key={p.id} producto={p} onCarritoUpdate={loadCart} />)
                          }
                        </div>
                      )
                    }
                  </>
                )}

                {/* ── CARRITO ───────────────────────────────────────────── */}
                {tab === "carrito" && (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:D.text }}>Mi Carrito</span>
                      {cartCount > 0 && (
                        <span style={{ fontSize:12, padding:"4px 12px", borderRadius:20, background:"rgba(56,189,248,0.12)", color:D.primary, border:"1px solid rgba(56,189,248,0.25)", fontWeight:600 }}>
                          {cartCount} prod. — Bs {cartTotal.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {cartItems.length > 0 ? (
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {cartItems.slice(0,5).map(item => (
                          <motion.div key={item.id} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background: isDark ? "rgba(56,189,248,0.04)" : D.bg, border:`1px solid ${D.border}` }}>
                            <div style={{ width:46, height:46, borderRadius:10, overflow:"hidden", flexShrink:0, background:"rgba(56,189,248,0.08)" }}>
                              <img src={item.imagen||"/placeholder.svg"} alt={item.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            </div>
                            <div style={{ flex:1 }}>
                              <p style={{ fontWeight:600, fontSize:13, color:D.text, margin:0 }}>{item.nombre}</p>
                              <p style={{ fontSize:12, color:D.muted, margin:"2px 0 0" }}>Bs {Number(item.precio).toFixed(2)} × {item.cantidad}</p>
                            </div>
                            <span style={{ fontWeight:700, fontSize:14, color:D.primary }}>Bs {(item.precio*item.cantidad).toFixed(2)}</span>
                          </motion.div>
                        ))}
                        {cartItems.length > 5 && (
                          <p style={{ textAlign:"center", fontSize:13, color:D.primary, padding:"10px 0" }}>+{cartItems.length-5} productos más</p>
                        )}
                        <div style={{ marginTop:8, padding:"16px", borderRadius:14, background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                            <span style={{ fontSize:13, color:D.muted }}>Total:</span>
                            <span style={{ fontSize:22, fontWeight:800, color:D.primary }}>Bs {cartTotal.toFixed(2)}</span>
                          </div>
                          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                            onClick={() => { window.dispatchEvent(new CustomEvent("carritoActualizado")); navigate("/dashboard-consumidor/carrito") }}
                            style={{ width:"100%", padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 0 20px rgba(34,197,94,0.22)" }}>
                            <ShoppingCart size={16} /> Ver carrito completo
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign:"center", padding:"48px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                        <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <ShoppingCart size={24} style={{ color:"rgba(56,189,248,0.4)" }} />
                        </div>
                        <div>
                          <p style={{ fontWeight:600, color:D.text, margin:"0 0 4px", fontSize:14 }}>Tu carrito está vacío</p>
                          <p style={{ fontSize:12, color:D.muted, margin:0 }}>Agrega productos desde la pestaña Productos</p>
                        </div>
                        <button onClick={() => setTab("productos")}
                          style={{ padding:"8px 18px", borderRadius:10, background:"rgba(56,189,248,0.1)", color:D.primary, border:`1px solid ${D.border}`, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                          Ver Productos
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── RESEÑAS ───────────────────────────────────────────── */}
                {tab === "resenas" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {user && (
                      <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : D.bg, border:`1px solid ${D.border}`, borderRadius:16, padding:18 }}>
                        <p style={{ fontWeight:700, fontSize:14, color:D.text, margin:"0 0 14px", display:"flex", alignItems:"center", gap:6 }}>
                          <MessageSquare size={15} style={{ color:D.primary }} /> Escribir una reseña
                        </p>
                        {reviewErr && <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(248,113,113,0.12)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", fontSize:12, marginBottom:10 }}>{reviewErr}</div>}
                        {reviewOk  && <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", fontSize:12, marginBottom:10 }}>✓ {reviewOk}</div>}
                        <form onSubmit={submitReview}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                            <div>
                              <label style={{ display:"block", fontSize:11, fontWeight:600, color:D.muted, marginBottom:5 }}>Producto</label>
                              <select value={reviewForm.producto_id} onChange={e => setReviewForm(p => ({ ...p, producto_id:e.target.value }))}
                                style={{ width:"100%", padding:"8px 10px", background: isDark ? "rgba(56,189,248,0.05)" : D.bg, border:`1px solid ${D.border}`, borderRadius:9, color:D.text, fontSize:13, outline:"none" }}>
                                <option value="">Selecciona un producto</option>
                                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display:"block", fontSize:11, fontWeight:600, color:D.muted, marginBottom:5 }}>Calificación</label>
                              <div style={{ display:"flex", gap:3, paddingTop:5 }}>
                                {[1,2,3,4,5].map(n => (
                                  <button key={n} type="button" onClick={() => setReviewForm(p => ({ ...p, calificacion:n }))}
                                    style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
                                    <Star size={22} style={{ color: n<=reviewForm.calificacion ? "#fbbf24" : D.border, fill: n<=reviewForm.calificacion ? "#fbbf24" : "transparent", transition:"all 0.15s" }} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <textarea value={reviewForm.comentario} onChange={e => setReviewForm(p => ({ ...p, comentario:e.target.value }))}
                            placeholder="Cuéntanos tu experiencia…" rows={3}
                            style={{ width:"100%", padding:"8px 10px", background: isDark ? "rgba(56,189,248,0.05)" : D.bg, border:`1px solid ${D.border}`, borderRadius:9, color:D.text, fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:12 }} />
                          <button type="submit" disabled={submitting}
                            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${D.primary},#14b8a6)`, color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, opacity:submitting ? 0.6 : 1 }}>
                            {submitting ? <Loader size={13} style={{ animation:"spin 1s linear infinite" }} /> : <Send size={13} />}
                            Publicar reseña
                          </button>
                        </form>
                      </div>
                    )}

                    {loadingReviews
                      ? <div style={{ textAlign:"center", padding:"32px 0" }}><Loader size={22} style={{ animation:"spin 1s linear infinite", color:D.primary, display:"block", margin:"0 auto 8px" }} /><p style={{ color:D.muted, fontSize:13 }}>Cargando reseñas…</p></div>
                      : reviews.length === 0
                        ? <div style={{ textAlign:"center", padding:"36px 0" }}><Star size={36} style={{ opacity:0.3, display:"block", margin:"0 auto 10px" }} /><p style={{ fontWeight:600, color:D.text, marginBottom:4 }}>Sin reseñas aún</p><p style={{ fontSize:13, color:D.muted }}>Sé el primero en dejar una reseña</p></div>
                        : reviews.map(r => (
                            <motion.div key={r.id} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
                              style={{ background: isDark ? "rgba(255,255,255,0.03)" : D.bg, border:`1px solid ${D.border}`, borderRadius:14, padding:16 }}>
                              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${D.primary},#14b8a6)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden", fontSize:14, fontWeight:700, color:"#fff" }}>
                                  {r.foto_perfil ? <img src={r.foto_perfil} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (r.usuario_nombre?.[0]||"U").toUpperCase()}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:4, marginBottom:4 }}>
                                    <div><span style={{ fontWeight:700, color:D.text, fontSize:13 }}>{r.usuario_nombre}</span><span style={{ fontSize:11, color:D.muted, marginLeft:6 }}>sobre <em>{r.producto_nombre}</em></span></div>
                                    <span style={{ fontSize:10, color:D.dim }}>{new Date(r.fecha).toLocaleDateString("es-BO",{month:"short",day:"numeric"})}</span>
                                  </div>
                                  <div style={{ display:"flex", gap:2, marginBottom:5 }}>
                                    {[1,2,3,4,5].map(n => <Star key={n} size={12} style={{ color:"#fbbf24", fill: n<=r.calificacion ? "#fbbf24" : "transparent" }} />)}
                                  </div>
                                  {r.comentario && <p style={{ fontSize:13, color:D.muted, margin:0, lineHeight:1.55 }}>{r.comentario}</p>}
                                  {r.respuesta && (
                                    <div style={{ marginTop:8, padding:"8px 10px", background: isDark ? "rgba(56,189,248,0.06)" : "rgba(56,189,248,0.05)", borderRadius:8, borderLeft:`3px solid ${D.primary}` }}>
                                      <p style={{ fontSize:11, fontWeight:700, color:D.primary, margin:"0 0 3px" }}>Respuesta del productor</p>
                                      <p style={{ fontSize:11, color:D.muted, margin:0 }}>{r.respuesta}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                    }
                  </div>
                )}

                {/* ── INFORMACIÓN ───────────────────────────────────────── */}
                {tab === "informacion" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

                    {productor.especialidad && (
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:D.muted, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                          <Fish size={12} color={D.primary} /> Especialidades
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {productor.especialidad.split(",").map((e,i) => (
                            <span key={i} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, background:"rgba(167,139,250,0.12)", color:"#c084fc", border:"1px solid rgba(167,139,250,0.28)" }}>{e.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {productor.dias_envio && (
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:D.muted, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                          <Truck size={12} color={D.primary} /> Días de envío
                        </p>
                        <div style={{ display:"flex", gap:4 }}>
                          {dias.map(d => {
                            const on = esDia(productor.dias_envio, d.key)
                            return (
                              <div key={d.key} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                                background: on ? "rgba(56,189,248,0.18)" : isDark ? "rgba(255,255,255,0.04)" : D.bg,
                                color: on ? D.primary : D.dim,
                                border: on ? "1px solid rgba(56,189,248,0.4)" : `1px solid ${D.border}` }}>
                                {d.label}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {productor.metodos_envio?.length > 0 && (
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:D.muted, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                          <Truck size={12} color={D.primary} /> Métodos de envío
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {productor.metodos_envio.map((m,i) => (
                            <span key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:10, fontSize:12, fontWeight:500, background: isDark ? "rgba(56,189,248,0.05)" : D.bg, border:`1px solid ${D.border}`, color:D.text }}>
                              <Truck size={12} color={D.primary} />{typeof m === "object" ? m.nombre : m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(productor.facebook || productor.instagram || productor.twitter || productor.sitio_web) && (
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:D.muted, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                          <Globe size={12} color={D.primary} /> Redes sociales
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {productor.facebook   && <a href={productor.facebook}   target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:10, fontSize:12, fontWeight:600, background:"rgba(59,130,246,0.1)", color:"#60a5fa", border:"1px solid rgba(59,130,246,0.25)", textDecoration:"none" }}><Facebook size={13} />Facebook</a>}
                          {productor.instagram  && <a href={productor.instagram}  target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:10, fontSize:12, fontWeight:600, background:"rgba(236,72,153,0.1)", color:"#f472b6", border:"1px solid rgba(236,72,153,0.25)", textDecoration:"none" }}><Instagram size={13} />Instagram</a>}
                          {productor.sitio_web  && <a href={productor.sitio_web}  target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:10, fontSize:12, fontWeight:600, background: isDark ? "rgba(255,255,255,0.05)" : D.bg, color:D.muted, border:`1px solid ${D.border}`, textDecoration:"none" }}><Globe size={13} />Sitio web</a>}
                        </div>
                      </div>
                    )}

                    {productor.vende_cocinado && (
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:14, background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.22)" }}>
                        <ChefHat size={22} color="#fb923c" style={{ flexShrink:0 }} />
                        <div>
                          <p style={{ fontWeight:700, color:"#fb923c", margin:"0 0 3px", fontSize:13 }}>¡También vende comida cocinada!</p>
                          <p style={{ fontSize:12, color:D.muted, margin:0 }}>Puedes pedir platillos preparados con sus productos frescos.</p>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </motion.div>

          </div>{/* fin main */}

        </div>{/* fin grid 2 col */}

      </div>
    </div>
  )
}

export default PerfilProductorVista
