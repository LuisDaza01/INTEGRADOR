import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  Fish, Menu, X, LogIn, UserPlus, ShoppingBag, Calendar,
  MessageCircle, Star, ArrowRight, Sparkles, Truck, Award,
  Users, Tractor, BarChart3, Heart, Leaf, MapPin, Send,
  Phone, Mail, Instagram, Facebook, CheckCircle2, Box,
} from "lucide-react"
import axios from "axios"

// ── Palette helpers ──
const GREEN  = "#22C55E"
const GREEN2 = "#4ade80"
const GREEN3 = "#16a34a"

// ── Partículas de fondo (verde brand) ──────────────────────────────────────
const FloatingParticles = () => {
  const [particles, setParticles] = useState([])
  useEffect(() => {
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: ((i * 137) % 100),
        y: ((i * 53) % 100),
        size: 2 + ((i * 7) % 4),
        delay: (i * 0.3) % 6,
        dur: 5 + ((i * 2) % 6),
      }))
    )
  }, [])
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.id % 3 === 0 ? GREEN2 : GREEN,
            boxShadow: `0 0 ${p.size * 4}px ${p.id % 3 === 0 ? GREEN2 : GREEN}`,
            opacity: 0.4,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

// ── Logo animado ──────────────────────────────────────────────────────────
const AnimatedLogo = () => (
  <motion.div className="flex items-center cursor-pointer"
    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
    whileHover={{ scale: 1.02 }}>
    <div className="relative w-11 h-11 mr-3 flex items-center justify-center">
      <motion.div className="absolute w-11 h-11 rounded-full border border-dashed"
        style={{ borderColor: `${GREEN}66` }}
        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }} />
      <motion.div className="absolute w-9 h-9 rounded-full border border-dotted"
        style={{ borderColor: `${GREEN2}55` }}
        animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} />
      <motion.div className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`, boxShadow: `0 0 14px ${GREEN}66` }}
        animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
        <Fish size={15} className="text-slate-950" />
      </motion.div>
    </div>
    <div className="text-xl font-bold text-white tracking-wide" style={{ fontFamily: "'Fira Code', monospace" }}>
      <span>Natura</span><span style={{ color: GREEN2 }} className="ml-0.5">Piscis</span>
    </div>
  </motion.div>
)

const getDashboardPath = (user) => {
  if (!user) return "/login"
  if (user.rol_id === 1) return "/dashboard-admin"
  if (user.rol_id === 2) return "/dashboard-productor"
  if (user.rol_id === 4) return "/dashboard-repartidor"
  return "/dashboard-consumidor"
}

// ── Sección reutilizable (header centrado) ────────────────────────────────
const SectionHeader = ({ kicker, title, sub }) => (
  <div className="text-center mb-12">
    {kicker && (
      <motion.div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-4"
        style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}44`, color: GREEN2 }}
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Sparkles size={12} />{kicker}
      </motion.div>
    )}
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Fira Code', monospace" }}>
      {title}
    </h2>
    <div className="w-16 h-1 mx-auto rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${GREEN3}, ${GREEN2})` }} />
    {sub && <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">{sub}</p>}
  </div>
)

// ── Tarjeta glass reutilizable ────────────────────────────────────────────
const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}
    whileHover={{ y: -6, scale: 1.01 }}
    className={`rounded-2xl p-6 backdrop-blur-xl ${className}`}
    style={{
      background: "rgba(15,30,22,0.45)",
      border: `1px solid ${GREEN}26`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${GREEN}10`,
    }}>
    {children}
  </motion.div>
)

const WelcomeHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/productos/destacados`)
        const raw = r.data
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
        setFeatured(list.slice(0, 3))
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [])

  const goLogin    = () => navigate("/login")
  const goRegistro = () => navigate("/registro")
  const goDashboard = () => navigate(getDashboardPath(user))
  const goCTA      = () => isAuthenticated ? goDashboard() : goRegistro()

  const menuItems = [
    { label: "Inicio",      href: "#inicio" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Productos",   href: "#productos" },
    { label: "Productores", href: "#productores" },
    { label: "Aliados",     href: "#aliados" },
    { label: "Contacto",    href: "#contacto" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100 bg-[#030712]">
      {/* Fondo profundo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#061a10] to-[#030712] z-0" />
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 10%, ${GREEN}10, transparent 40%)` }} />
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full pointer-events-none z-0"
        style={{ background: `${GREEN}0c`, filter: "blur(90px)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full pointer-events-none z-0"
        style={{ background: `${GREEN2}0a`, filter: "blur(90px)" }} />

      <FloatingParticles />

      {/* ─────────────── HEADER ─────────────── */}
      <motion.header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="max-w-7xl mx-auto rounded-2xl backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          style={{ background: "rgba(8,20,14,0.55)", border: `1px solid ${GREEN}20` }}>
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <AnimatedLogo />
            <nav className="hidden lg:flex items-center space-x-6">
              {menuItems.map((item, i) => (
                <motion.a key={i} href={item.href}
                  className="text-slate-300 hover:text-white font-medium text-sm tracking-wide relative group py-2 px-1"
                  whileHover={{ y: -1 }}>
                  {item.label}
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform"
                    style={{ background: `linear-gradient(90deg, ${GREEN2}, ${GREEN})` }} />
                </motion.a>
              ))}
            </nav>
            <div className="hidden lg:flex items-center space-x-3">
              {!isAuthenticated ? (
                <>
                  <motion.button onClick={goLogin}
                    className="px-5 py-2.5 text-slate-300 hover:text-white flex items-center gap-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5"
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <LogIn size={16} /><span className="font-semibold text-sm">Iniciar sesión</span>
                  </motion.button>
                  <motion.button onClick={goRegistro}
                    className="px-6 py-2.5 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`, boxShadow: `0 0 20px ${GREEN}40` }}
                    whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}>
                    <UserPlus size={16} /><span>Registrarse</span>
                  </motion.button>
                </>
              ) : (
                <motion.button onClick={goDashboard}
                  className="px-6 py-2.5 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`, boxShadow: `0 0 20px ${GREEN}40` }}
                  whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}>
                  <span>Mi Dashboard</span><ArrowRight size={16} />
                </motion.button>
              )}
            </div>
            <motion.button onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-white p-2 rounded-xl hover:bg-slate-800/40"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ─────────────── DRAWER MOBILE ─────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <motion.div className="absolute right-0 top-0 h-full w-80 p-6 shadow-2xl"
              style={{ background: "#030712", borderLeft: `1px solid ${GREEN}20` }}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex flex-col h-full pt-6">
                <div className="flex justify-between items-center mb-8">
                  <AnimatedLogo />
                  <motion.button whileHover={{ rotate: 90 }} onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/5">
                    <X size={20} className="text-slate-400" />
                  </motion.button>
                </div>
                <nav className="flex-1">
                  <ul className="space-y-2">
                    {menuItems.map((item, i) => (
                      <li key={i}>
                        <a href={item.href} onClick={() => setIsMenuOpen(false)}
                          className="block py-3 px-4 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-semibold text-sm">
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="space-y-3">
                  {!isAuthenticated ? (
                    <>
                      <button onClick={() => { setIsMenuOpen(false); goLogin() }}
                        className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm"
                        style={{ background: "#0f1825", border: `1px solid ${GREEN}20`, color: "#cbd5e1" }}>
                        <LogIn size={16} /><span>Iniciar sesión</span>
                      </button>
                      <button onClick={() => { setIsMenuOpen(false); goRegistro() }}
                        className="w-full py-3 px-4 rounded-xl text-slate-950 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})` }}>
                        <UserPlus size={16} /><span>Registrarse</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setIsMenuOpen(false); goDashboard() }}
                      className="w-full py-3 px-4 rounded-xl text-slate-950 flex items-center justify-center gap-2 font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})` }}>
                      <span>Mi Dashboard</span><ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────── HERO ─────────────── */}
      <section id="inicio" className="relative z-10 pt-36 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-6"
              style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}40`, color: GREEN2 }}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Sparkles size={13} className="animate-pulse" />
              <span>MARKETPLACE ACUÍCOLA · DEL CHACO BOLIVIANO</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              Del productor a tu mesa,{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(90deg, ${GREEN2}, ${GREEN}, ${GREEN3})`,
                  WebkitBackgroundClip: "text", filter: `drop-shadow(0 0 20px ${GREEN}40)` }}>
                sin intermediarios
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              Reserva pescado fresco directamente del criadero. Llega en trufi desde Tacopaya hasta tu parada en Cochabamba.
              <span className="font-semibold" style={{ color: GREEN2 }}> Trazabilidad, frescura y precio justo.</span>
            </motion.p>

            {/* Mini-stats */}
            <motion.div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              {[
                { n: "2,500+", l: "Clientes" },
                { n: "150+",   l: "Productores" },
                { n: "4.8★",   l: "Promedio" },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold" style={{ color: GREEN2 }}>{s.n}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{s.l}</div>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div className="flex flex-col sm:flex-row justify-center items-center gap-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }}>
              <motion.button onClick={goCTA}
                className="px-8 py-4 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-3 text-base min-w-[230px]"
                style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`, boxShadow: `0 0 28px ${GREEN}50` }}
                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                <ShoppingBag size={20} />
                <span>{isAuthenticated ? "Ir a mi dashboard" : "Crear cuenta gratis"}</span>
                <ArrowRight size={18} />
              </motion.button>
              {!isAuthenticated && (
                <motion.button onClick={goLogin}
                  className="px-8 py-4 text-white rounded-xl flex items-center justify-center gap-3 text-base font-semibold min-w-[230px]"
                  style={{ background: "rgba(15,30,22,0.55)", border: `1px solid ${GREEN}66`, backdropFilter: "blur(10px)" }}
                  whileHover={{ scale: 1.04, y: -2, background: `${GREEN}10` }} whileTap={{ scale: 0.96 }}>
                  <LogIn size={20} /><span>Iniciar sesión</span>
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────── CÓMO FUNCIONA ─────────────── */}
      <section id="como-funciona" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <SectionHeader
            kicker="EN 3 PASOS"
            title="Cómo funciona"
            sub="Modelo simple: reserva, el trufi lo lleva, recoges en la parada. Sin pago adelantado — el precio se cierra al pesar."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { n: 1, icon: Calendar,    title: "Reserva en línea", desc: "Elige tus pescados y el día de venta del productor. Recibes un código NP-XXXXXX único." },
              { n: 2, icon: Truck,       title: "Sale en trufi",    desc: "El productor entrega tu paquete al conductor del trufi en Tacopaya. Te llega un push con la hora estimada." },
              { n: 3, icon: ShoppingBag, title: "Recoges fresco",   desc: "Vas a la parada acordada en Cochabamba con tu código y retiras. Pagas QR ahí mismo, monto exacto tras el pesaje." },
            ].map(({ n, icon: Icon, title, desc }, i) => (
              <GlassCard key={n} delay={i * 0.1} className="text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
                  style={{ background: `linear-gradient(90deg, transparent, ${GREEN2}, transparent)` }} />
                <div className="text-7xl font-extrabold mb-4 opacity-10" style={{ color: GREEN }}>{n}</div>
                <div className="w-14 h-14 rounded-2xl mx-auto -mt-12 mb-4 flex items-center justify-center"
                  style={{ background: `${GREEN}1f`, border: `1px solid ${GREEN}55`, boxShadow: `0 0 18px ${GREEN}33` }}>
                  <Icon size={26} style={{ color: GREEN2 }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── PRODUCTOS DESTACADOS ─────────────── */}
      <section id="productos" className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <SectionHeader
            kicker="LO MÁS FRESCO"
            title="Productos destacados"
            sub="Cosechados al día, trazabilidad desde el estanque hasta tu mesa."
          />

          {loading ? (
            <div className="flex justify-center py-10">
              <motion.div className="w-12 h-12 border-2 border-t-transparent rounded-full"
                style={{ borderColor: GREEN, borderTopColor: "transparent" }}
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            </div>
          ) : featured.length === 0 ? (
            <div className="max-w-md mx-auto text-center">
              <GlassCard><Fish size={32} className="mx-auto mb-3" style={{ color: GREEN }} />
                <p className="text-sm text-slate-400">Aún no hay productos destacados.</p>
              </GlassCard>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {featured.map((p, i) => (
                <GlassCard key={p.id} delay={i * 0.1}>
                  <div className="flex flex-col items-center text-center">
                    <motion.div className="w-24 h-24 rounded-2xl mb-5 flex items-center justify-center overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${GREEN}15, ${GREEN3}25)`, border: `1px solid ${GREEN}30` }}
                      whileHover={{ scale: 1.08, rotate: 3 }}>
                      {p.imagen
                        ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover rounded-xl"
                            onError={e => { e.currentTarget.style.display = "none" }} />
                        : <Fish size={36} style={{ color: GREEN2 }} />}
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Fira Code', monospace" }}>
                      {p.nombre}
                    </h3>
                    <div className="text-xl font-bold mb-5" style={{ color: GREEN2 }}>
                      Bs. {parseFloat(p.precio || 0).toFixed(2)}/{p.unidad || "kg"}
                    </div>
                    <motion.button onClick={goCTA}
                      className="w-full px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white"
                      style={{ background: "transparent", border: `1px solid ${GREEN}66` }}
                      whileHover={{ scale: 1.03, background: `${GREEN}15` }} whileTap={{ scale: 0.97 }}>
                      <ShoppingBag size={15} /><span>Reservar</span>
                    </motion.button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────── PARA PRODUCTORES ─────────────── */}
      <section id="productores" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <SectionHeader
            kicker="SI ERES PRODUCTOR ACUÍCOLA"
            title="Vende mejor, gestiona desde tu celular"
            sub="Herramientas pensadas para piscicultores: monitoreo IoT de tus lagunas, reservas que se llenan solas, estadísticas con IA."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { icon: Tractor,    title: "Gestión de lagunas", desc: "Siembras, alimento, mortalidad. Todo en una pantalla." },
              { icon: BarChart3,  title: "Estadísticas + IA",  desc: "Resumen mensual generado por Claude. Excel exportable." },
              { icon: Calendar,   title: "Calendario público", desc: "Eliges qué días vendes. Los consumidores reservan." },
              { icon: Award,      title: "Verificación",       desc: "Insignia de productor verificado. Más confianza, más ventas." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <GlassCard key={title} delay={i * 0.08}>
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}33` }}>
                  <Icon size={22} style={{ color: GREEN2 }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </GlassCard>
            ))}
          </div>
          <div className="text-center mt-10">
            <motion.button onClick={goRegistro}
              className="px-8 py-3.5 text-slate-950 font-bold rounded-xl inline-flex items-center gap-2 text-sm"
              style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`, boxShadow: `0 0 24px ${GREEN}44` }}
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Tractor size={16} /><span>Quiero vender en NaturaPiscis</span><ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ─────────────── PARA CONSUMIDORES ─────────────── */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <SectionHeader
            kicker="SI QUIERES COMER PESCADO FRESCO"
            title="Frescura del Chapare a tu cocina"
            sub="Sin intermediarios, sin sorpresas. Pescado entregado el mismo día de la cosecha."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Leaf,    title: "Sostenible",        desc: "Cría natural en lagunas del Chapare boliviano. Alimentación responsable y trazable." },
              { icon: Heart,   title: "Precio justo",      desc: "Pagas lo que el productor recibe. Sin intermediarios inflando el costo." },
              { icon: MapPin,  title: "Paradas cercanas",  desc: "Eliges dónde recoger: Terminal, Villa Tunari u otras paradas del trufi." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <GlassCard key={title} delay={i * 0.1}>
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}33` }}>
                  <Icon size={22} style={{ color: GREEN2 }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── ALIADOS / INSTITUCIONES ─────────────── */}
      <section id="aliados" className="relative z-10 py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <GlassCard className="!p-10 md:!p-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-5"
              style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}44`, color: GREEN2 }}>
              <Users size={12} />ALIADOS · INSTITUCIONES · INVERSORES
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Fira Code', monospace" }}>
              Construyendo el futuro de la pesca artesanal en Bolivia
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              NaturaPiscis es una plataforma boliviana que conecta productores acuícolas del Chapare con consumidores
              en Cochabamba a través de tecnología accesible. Buscamos alianzas con instituciones, ONGs y fondos
              que quieran impulsar la digitalización del sector primario.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {[
                { icon: CheckCircle2, label: "Impacto rural" },
                { icon: CheckCircle2, label: "Trazabilidad alimentaria" },
                { icon: CheckCircle2, label: "Tecnología IoT + IA" },
                { icon: CheckCircle2, label: "Producción sostenible" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}26` }}>
                  <Icon size={14} style={{ color: GREEN2 }} />
                  <span className="text-sm text-slate-300">{label}</span>
                </div>
              ))}
            </div>
            <a href="mailto:contacto@naturapiscis.bo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}66` }}>
              <Send size={15} /><span>Contactar al equipo</span>
            </a>
          </GlassCard>
        </div>
      </section>

      {/* ─────────────── CTA FINAL ─────────────── */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.h2
            className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Fira Code', monospace" }}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            ¿Listo para probar?{" "}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: `linear-gradient(90deg, ${GREEN2}, ${GREEN})`, WebkitBackgroundClip: "text" }}>
              Crea tu cuenta gratis.
            </span>
          </motion.h2>
          <p className="text-slate-400 mb-8">Sin tarjeta, sin compromiso. Solo creas tu cuenta y reservas cuando quieras.</p>
          <motion.button onClick={goCTA}
            className="px-10 py-4 text-slate-950 font-bold rounded-xl inline-flex items-center gap-3 text-lg"
            style={{ background: `linear-gradient(135deg, ${GREEN3}, ${GREEN}, ${GREEN2})`, boxShadow: `0 0 36px ${GREEN}66` }}
            whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.96 }}>
            <Sparkles size={20} />
            <span>{isAuthenticated ? "Ir a mi dashboard" : "Crear cuenta gratis"}</span>
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer id="contacto" className="relative z-10 mt-12 pt-12 pb-8 border-t" style={{ borderColor: `${GREEN}1a` }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <AnimatedLogo />
              <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed">
                Marketplace acuícola boliviano. Pescado fresco del Chapare directo a tu mesa, con trazabilidad
                completa y soporte para productores locales.
              </p>
              <div className="flex gap-3 mt-5">
                {[Instagram, Facebook, MessageCircle].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg flex items-center justify-center hover:scale-110 transition"
                    style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}26`, color: GREEN2 }}>
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Producto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#como-funciona" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#productos" className="hover:text-white">Productos</a></li>
                <li><a href="#productores" className="hover:text-white">Para productores</a></li>
                <li><a href="#aliados" className="hover:text-white">Para aliados</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Contacto</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2"><Mail size={14} style={{ color: GREEN2 }} /> contacto@naturapiscis.bo</li>
                <li className="flex items-center gap-2"><Phone size={14} style={{ color: GREEN2 }} /> +591 6 942 7320</li>
                <li className="flex items-center gap-2"><MapPin size={14} style={{ color: GREEN2 }} /> Cochabamba, Bolivia</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500"
            style={{ borderColor: `${GREEN}10` }}>
            <p>© {new Date().getFullYear()} NaturaPiscis · Hecho con 🐟 en Bolivia</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white">Términos</a>
              <a href="#" className="hover:text-white">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default WelcomeHome
