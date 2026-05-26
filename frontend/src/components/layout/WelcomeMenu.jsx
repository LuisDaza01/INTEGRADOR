import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  Fish, Menu, X, LogIn, UserPlus, ShoppingBag, Anchor,
  Waves, Ship, MessageCircle, Phone, Star, ArrowRight,
  ShieldAlert, Cpu, Sparkles
} from "lucide-react"
import axios from "axios"

// ── Partículas de Agua/Energía Quantum en el Fondo ──
const WaterParticles = () => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 5 + 2,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.55 + 0.15,
    }))
    setParticles(newParticles)

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => {
        let newX = p.x + p.speedX
        let newY = p.y + p.speedY
        if (newX <= 0 || newX >= window.innerWidth)  { p.speedX *= -1; newX = p.x + p.speedX }
        if (newY <= 0 || newY >= window.innerHeight) { p.speedY *= -1; newY = p.y + p.speedY }
        return { ...p, x: newX, y: newY }
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-cyan-400 via-emerald-400 to-green-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            opacity: p.opacity,
            filter: "blur(0.4px)",
          }}
        />
      ))}
    </div>
  )
}

// ── Ondas de Agua con colores neón ──
const WaterWaves = () => (
  <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden z-10 pointer-events-none">
    <motion.div className="absolute bottom-0 left-0 right-0 w-full"
      initial={{ y: 100 }} animate={{ y: 0 }} transition={{ duration: 1.5, ease: "easeOut" }}>
      <svg className="w-full h-auto min-h-[120px]" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.18)" />
            <stop offset="100%" stopColor="rgba(3,7,18,0.95)" />
          </linearGradient>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.15)" />
            <stop offset="100%" stopColor="rgba(3,7,18,0.98)" />
          </linearGradient>
        </defs>
        <motion.path fill="url(#wave1)"
          d="M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L0,320Z"
          animate={{ d: [
            "M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L0,320Z",
            "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,229.3C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z",
            "M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L0,320Z"
          ] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }} />
        <motion.path fill="url(#wave2)"
          d="M0,256L48,261.3C96,267,192,277,288,261.3C384,245,480,203,576,197.3C672,192,768,224,864,213.3C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L0,320Z"
          animate={{ d: [
            "M0,256L48,261.3C96,267,192,277,288,261.3C384,245,480,203,576,197.3C672,192,768,224,864,213.3C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L0,320Z",
            "M0,224L48,229.3C96,235,192,245,288,240C384,235,480,213,576,202.7C672,192,768,192,864,208C960,224,1056,256,1152,261.3C1248,267,1344,245,1392,234.7L1440,224L1440,320L0,320Z",
            "M0,256L48,261.3C96,267,192,277,288,261.3C384,245,480,203,576,197.3C672,192,768,224,864,213.3C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L0,320Z"
          ] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 0.5 }} />
      </svg>
    </motion.div>
  </div>
)

// ── Logotipo Cuántico con Órbitas Giratorias ──
const AnimatedLogo = () => (
  <motion.div className="flex items-center cursor-pointer"
    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
    whileHover={{ scale: 1.02 }}>
    <div className="relative w-11 h-11 mr-3 flex items-center justify-center">
      {/* Órbita rota derecha */}
      <motion.div
        className="absolute w-11 h-11 rounded-full border border-dashed border-cyan-400/40"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
      />
      {/* Órbita rota izquierda */}
      <motion.div
        className="absolute w-9 h-9 rounded-full border border-dotted border-emerald-400/35"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      />
      {/* Núcleo con gradiente */}
      <motion.div
        className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <Fish size={15} className="text-slate-950" />
      </motion.div>
    </div>
    <div className="text-xl font-bold text-white flex items-center tracking-wide" style={{ fontFamily: "'Fira Code', monospace" }}>
      <span>Natura</span><span className="text-cyan-400 ml-0.5">Piscis</span>
    </div>
  </motion.div>
)

const getDashboardPath = (user) => {
  if (!user) return "/login"
  if (user.rol_id === 1) return "/dashboard-admin"
  if (user.rol_id === 2) return "/dashboard-productor"
  return "/dashboard-consumidor"
}

const WelcomeHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/productos/destacados`
        )
        const raw = response.data
        const list = Array.isArray(raw) ? raw : (raw.data ? (Array.isArray(raw.data) ? raw.data : []) : [])
        setFeaturedProducts(list.slice(0, 3))
      } catch (err) {
        console.error("Error al obtener productos destacados:", err)
        setError("No se pudieron cargar los productos destacados")
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedProducts()
  }, [])

  const handleExplore = () => navigate(isAuthenticated ? getDashboardPath(user) : "/login")

  const menuItems = [
    { name: "Inicio", icon: <Anchor size={16} />, href: "#inicio" },
    { name: "Productos", icon: <ShoppingBag size={16} />, href: "#productos" },
    { name: "Servicios", icon: <Ship size={16} />, href: "#servicios" },
    { name: "Tecnología", icon: <Waves size={16} />, href: "#tecnologia" },
    { name: "Contacto", icon: <MessageCircle size={16} />, href: "#contacto" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100 bg-[#030712]">
      {/* Fondo estelar profundo con sutil rejilla */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#090e1a] to-[#030712] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      
      {/* Grandes nebulosas neón en las esquinas */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none z-0" />

      <WaterParticles />

      {/* Header Glassmorphism */}
      <motion.header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="max-w-7xl mx-auto rounded-2xl backdrop-blur-xl bg-slate-900/35 border border-cyan-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <AnimatedLogo />
              <nav className="hidden lg:flex items-center space-x-6">
                {menuItems.map((item, i) => (
                  <motion.a key={i} href={item.href}
                    className="text-slate-300 hover:text-cyan-400 flex items-center space-x-2 relative group py-2 px-3 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05, y: -1 }}>
                    <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>
                    <span className="font-medium text-sm tracking-wide">{item.name}</span>
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-cyan-400 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </motion.a>
                ))}
              </nav>
              <div className="hidden lg:flex items-center space-x-4">
                {!isAuthenticated ? (
                  <>
                    <motion.button className="px-5 py-2.5 text-slate-300 hover:text-white flex items-center space-x-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/login")}>
                      <LogIn size={16} /><span className="font-semibold text-sm">Iniciar sesión</span>
                    </motion.button>
                    <motion.button className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      whileHover={{ scale: 1.04, translateY: -1 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/registro")}>
                      <UserPlus size={16} /><span>Registrarse</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-bold text-sm rounded-xl flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    whileHover={{ scale: 1.04, translateY: -1 }} whileTap={{ scale: 0.96 }} onClick={() => navigate(getDashboardPath(user))}>
                    <span>Mi Dashboard</span><ArrowRight size={16} />
                  </motion.button>
                )}
              </div>
              <motion.button className="lg:hidden text-white p-2 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-white/5"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Menú móvil */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <motion.div className="absolute right-0 top-0 h-full w-80 bg-slate-950 border-l border-cyan-500/10 shadow-2xl p-6"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex flex-col h-full pt-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white text-lg font-bold tracking-wide">Menú</h3>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/5">
                    <X size={22} className="text-slate-400" />
                  </motion.button>
                </div>
                <nav className="flex-1">
                  <ul className="space-y-2">
                    {menuItems.map((item, i) => (
                      <motion.li key={i} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
                        <a href={item.href} onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 text-slate-300 py-3 px-4 rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 group transition-all">
                          <span className="opacity-80 group-hover:opacity-100">{item.icon}</span>
                          <span className="font-semibold text-sm tracking-wider">{item.name}</span>
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-auto space-y-3">
                  {!isAuthenticated ? (
                    <>
                      <motion.button className="w-full py-3 px-4 bg-slate-900 border border-white/5 text-slate-300 rounded-xl flex items-center justify-center space-x-2 font-semibold text-sm hover:bg-slate-800 transition"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsMenuOpen(false); navigate("/login") }}>
                        <LogIn size={16} /><span>Iniciar sesión</span>
                      </motion.button>
                      <motion.button className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 rounded-xl flex items-center justify-center space-x-2 font-bold text-sm"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsMenuOpen(false); navigate("/registro") }}>
                        <UserPlus size={16} /><span>Registrarse</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 rounded-xl flex items-center justify-center space-x-2 font-bold text-sm"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsMenuOpen(false); navigate(getDashboardPath(user)) }}>
                      <span>Mi Dashboard</span><ArrowRight size={16} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Hero */}
      <main className="relative z-10 pt-36 pb-32 min-h-screen flex flex-col justify-center">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Medalla IoT / Sostenibilidad */}
            <motion.div
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-semibold tracking-wider mb-8"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            >
              <Sparkles size={13} className="animate-pulse" />
              <span>ACUICULTURA DIGITAL Y BIENESTAR SOSTENIBLE</span>
            </motion.div>

            <motion.div className="mb-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Bienvenido a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-green-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                  NaturaPiscis
                </span>
              </h1>
              
              {/* Estrellas Quantum */}
              <div className="flex items-center justify-center space-x-1.5 mb-6">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}>
                    <Star size={16} className="text-cyan-400 fill-current drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              Plataforma cuántica de acuicultura sostenible. Compra directo del productor piscícola local con
              <span className="text-cyan-400 font-semibold drop-shadow-[0_0_6px_rgba(6,182,212,0.2)]"> monitoreo IoT las 24 horas y trazabilidad garantizada.</span>
            </motion.p>

            {/* Acciones principales */}
            <motion.div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-5 mb-24"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}>
              <motion.button className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-base min-w-[210px]"
                whileHover={{ scale: 1.04, translateY: -2 }} whileTap={{ scale: 0.96 }} onClick={handleExplore}>
                <ShoppingBag size={20} /><span>Explorar Productos</span><ArrowRight size={18} />
              </motion.button>
              {!isAuthenticated && (
                <motion.button className="group px-8 py-4 bg-slate-950 border border-cyan-500/35 text-white rounded-xl flex items-center justify-center space-x-3 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all text-base font-semibold min-w-[210px]"
                  whileHover={{ scale: 1.04, translateY: -2 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/login")}>
                  <LogIn size={20} /><span>Iniciar Sesión</span>
                </motion.button>
              )}
            </motion.div>

            {/* Productos destacados */}
            <motion.div className="mt-12" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Fira Code', monospace" }}>Productos Destacados</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full mb-4" />
                <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">Trazabilidad en tiempo real del estanque a tu mesa</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <motion.div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                </div>
              ) : error || featuredProducts.length === 0 ? (
                <motion.div className="bg-slate-900/40 border border-cyan-500/15 rounded-2xl p-8 backdrop-blur-md max-w-md mx-auto"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Fish size={32} className="text-cyan-400 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">
                    {featuredProducts.length === 0
                      ? "Aún no hay productos destacados. El administrador cargará productos próximamente."
                      : error}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {featuredProducts.map((product, index) => (
                    <motion.div key={product.id}
                      className="group relative bg-slate-900/35 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-cyan-500/15 hover:border-cyan-400/40 transition-all duration-300 overflow-hidden"
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                      whileHover={{ y: -6, scale: 1.015 }}>
                      
                      {/* Shimmer line neón arriba de la card */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col items-center text-center">
                        <motion.div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-emerald-950/40 border border-cyan-500/15 p-2 mb-6 flex items-center justify-center overflow-hidden shadow-lg"
                          whileHover={{ scale: 1.08, rotate: 3 }}>
                          {product.imagen
                            ? <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover rounded-xl" onError={e => { e.target.style.display='none' }} />
                            : <Fish size={36} className="text-cyan-400" />}
                        </motion.div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors" style={{ fontFamily: "'Fira Code', monospace" }}>{product.nombre}</h3>
                        <div className="text-xl font-bold text-emerald-400 mb-5">
                          Bs. {parseFloat(product.precio || 0).toFixed(2)}/kg
                        </div>
                        <motion.button
                          className="w-full px-5 py-2.5 bg-slate-950 border border-cyan-500/30 group-hover:border-cyan-400 text-white rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold hover:bg-cyan-500/10 transition"
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExplore}>
                          <ShoppingBag size={15} /><span>Ver detalles</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <WaterWaves />

      {/* FAB Flotante */}
      <motion.div className="fixed bottom-8 right-8 z-20"
        initial={{ opacity: 0, scale: 0.5, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, type: "spring" }}>
        <motion.button className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 rounded-full p-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] relative"
          whileHover={{ scale: 1.12, rotate: 5 }} whileTap={{ scale: 0.9 }}
          animate={{ y: [0,-4,0] }} transition={{ y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}>
          <Phone size={22} />
          <motion.div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full"
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        </motion.button>
      </motion.div>
    </div>
  )
}

export default WelcomeHome