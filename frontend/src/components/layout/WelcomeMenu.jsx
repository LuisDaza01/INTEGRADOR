import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  Fish, Menu, X, LogIn, UserPlus, ShoppingBag, Anchor,
  Waves, Ship, MessageCircle, Phone, Star, ArrowRight,
} from "lucide-react"
import axios from "axios"

const WaterParticles = () => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 6 + 3,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      opacity: Math.random() * 0.6 + 0.2,
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
    }, 60)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-gradient-to-br from-blue-300 to-cyan-400"
          style={{ width: p.size, height: p.size, left: p.x, top: p.y, opacity: p.opacity, filter: "blur(0.5px)" }} />
      ))}
    </div>
  )
}

const WaterWaves = () => (
  <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden z-10">
    <motion.div className="absolute bottom-0 left-0 right-0"
      initial={{ y: 120 }} animate={{ y: 0 }} transition={{ duration: 2, ease: "easeOut" }}>
      <svg className="w-full h-auto" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.4)" /><stop offset="100%" stopColor="rgba(37,99,235,0.6)" />
          </linearGradient>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.6)" /><stop offset="100%" stopColor="rgba(29,78,216,0.8)" />
          </linearGradient>
          <linearGradient id="wave3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(37,99,235,0.8)" /><stop offset="100%" stopColor="rgba(29,78,216,1)" />
          </linearGradient>
        </defs>
        <motion.path fill="url(#wave1)"
          d="M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L0,320Z"
          animate={{ d: ["M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L0,320Z","M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,229.3C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z","M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L0,320Z"] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }} />
        <motion.path fill="url(#wave2)"
          d="M0,256L48,261.3C96,267,192,277,288,261.3C384,245,480,203,576,197.3C672,192,768,224,864,213.3C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L0,320Z"
          animate={{ d: ["M0,256L48,261.3C96,267,192,277,288,261.3C384,245,480,203,576,197.3C672,192,768,224,864,213.3C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L0,320Z","M0,224L48,229.3C96,235,192,245,288,240C384,235,480,213,576,202.7C672,192,768,192,864,208C960,224,1056,256,1152,261.3C1248,267,1344,245,1392,234.7L1440,224L1440,320L0,320Z","M0,256L48,261.3C96,267,192,277,288,261.3C384,245,480,203,576,197.3C672,192,768,224,864,213.3C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L0,320Z"] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 0.5 }} />
        <motion.path fill="url(#wave3)"
          d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,272C960,277,1056,267,1152,234.7C1248,203,1344,149,1392,122.7L1440,96L1440,320L0,320Z"
          animate={{ d: ["M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,272C960,277,1056,267,1152,234.7C1248,203,1344,149,1392,122.7L1440,96L1440,320L0,320Z","M0,256L48,250.7C96,245,192,235,288,224C384,213,480,203,576,202.7C672,203,768,213,864,229.3C960,245,1056,267,1152,266.7C1248,267,1344,245,1392,234.7L1440,224L1440,320L0,320Z","M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,272C960,277,1056,267,1152,234.7C1248,203,1344,149,1392,122.7L1440,96L1440,320L0,320Z"] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }} />
      </svg>
    </motion.div>
  </div>
)

const AnimatedLogo = () => (
  <motion.div className="flex items-center cursor-pointer"
    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
    whileHover={{ scale: 1.02 }}>
    <motion.div className="relative w-12 h-12 mr-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center overflow-hidden shadow-lg"
      whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
      <motion.div className="absolute" animate={{ y: [-2,2,-2], rotate: [-5,5,-5] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
        <Fish size={26} className="text-white drop-shadow-sm" />
      </motion.div>
    </motion.div>
    <div className="text-2xl font-bold text-white flex items-center">
      <span>Natura</span><span className="text-blue-200 ml-0.5">Piscis</span>
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
        // Manejar tanto array directo como { data: [...] } o { data: { data: [...] } }
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
    { name: "Inicio", icon: <Anchor size={18} />, href: "#inicio" },
    { name: "Productos", icon: <ShoppingBag size={18} />, href: "#productos" },
    { name: "Servicios", icon: <Ship size={18} />, href: "#servicios" },
    { name: "Tecnología", icon: <Waves size={18} />, href: "#tecnologia" },
    { name: "Contacto", icon: <MessageCircle size={18} />, href: "#contacto" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 z-0" />
      <WaterParticles />

      {/* Header */}
      <motion.header className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="backdrop-blur-xl bg-blue-900/30 border-b border-blue-400/20 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <AnimatedLogo />
              <nav className="hidden lg:flex items-center space-x-8">
                {menuItems.map((item, i) => (
                  <motion.a key={i} href={item.href}
                    className="text-blue-100 hover:text-white flex items-center space-x-2 relative group py-2 px-3 rounded-lg"
                    whileHover={{ scale: 1.05, y: -1 }}>
                    <span className="opacity-80 group-hover:opacity-100">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </motion.a>
                ))}
              </nav>
              <div className="hidden lg:flex items-center space-x-4">
                {!isAuthenticated ? (
                  <>
                    <motion.button className="px-6 py-2.5 text-blue-100 hover:text-white flex items-center space-x-2 rounded-lg hover:bg-blue-800/30"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/login")}>
                      <LogIn size={18} /><span className="font-medium">Iniciar sesión</span>
                    </motion.button>
                    <motion.button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center space-x-2 shadow-lg font-medium"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/registro")}>
                      <UserPlus size={18} /><span>Registrarse</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center space-x-2 shadow-lg font-medium"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(getDashboardPath(user))}>
                    <span>Mi Dashboard</span><ArrowRight size={18} />
                  </motion.button>
                )}
              </div>
              <motion.button className="lg:hidden text-white p-2 rounded-lg hover:bg-blue-800/30"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            <motion.div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-b from-blue-800 to-blue-900 shadow-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white text-lg font-semibold">Menú</h3>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-blue-700/50">
                    <X size={24} className="text-white" />
                  </motion.button>
                </div>
                <nav className="flex-1">
                  <ul className="space-y-2">
                    {menuItems.map((item, i) => (
                      <motion.li key={i} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                        <a href={item.href} onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 text-white py-3 px-4 rounded-xl hover:bg-blue-700/50 group">
                          <span className="opacity-80 group-hover:opacity-100">{item.icon}</span>
                          <span className="font-medium">{item.name}</span>
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-auto space-y-3">
                  {!isAuthenticated ? (
                    <>
                      <motion.button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center space-x-2 font-medium"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsMenuOpen(false); navigate("/login") }}>
                        <LogIn size={18} /><span>Iniciar sesión</span>
                      </motion.button>
                      <motion.button className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-blue-600 rounded-xl flex items-center justify-center space-x-2 font-medium"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsMenuOpen(false); navigate("/registro") }}>
                        <UserPlus size={18} /><span>Registrarse</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center space-x-2 font-medium"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsMenuOpen(false); navigate(getDashboardPath(user)) }}>
                      <span>Mi Dashboard</span><ArrowRight size={18} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="relative z-10 pt-32 pb-32 min-h-screen flex flex-col justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div className="mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                Bienvenido a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300">
                  NaturaPiscis
                </span>
              </h1>
              <div className="flex items-center justify-center space-x-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} animate={{ scale: [1,1.2,1], rotate: [0,10,0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}>
                    <Star size={20} className="text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              Descubre los mejores productos de acuicultura sostenible, directamente de productores locales a tu mesa.
              <span className="text-cyan-200 font-medium"> Calidad premium, frescura garantizada.</span>
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-20"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
              <motion.button className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center space-x-3 shadow-xl text-lg font-semibold min-w-[200px]"
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleExplore}>
                <ShoppingBag size={22} /><span>Explorar Productos</span><ArrowRight size={20} />
              </motion.button>
              {!isAuthenticated && (
                <motion.button className="group px-8 py-4 bg-transparent border-2 border-white/80 text-white rounded-xl flex items-center justify-center space-x-3 hover:bg-white hover:text-blue-600 transition-all duration-300 text-lg font-semibold min-w-[200px] backdrop-blur-sm"
                  whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/login")}>
                  <LogIn size={22} /><span>Iniciar Sesión</span>
                </motion.button>
              )}
            </motion.div>

            {/* Productos destacados */}
            <motion.div className="mt-20" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Productos Destacados</h2>
                <p className="text-blue-200 text-lg">Los favoritos de nuestros clientes</p>
              </div>

              {loading ? (
                <div className="flex justify-center">
                  <motion.div className="w-16 h-16 border-4 border-blue-200 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                </div>
              ) : error || featuredProducts.length === 0 ? (
                <motion.div className="bg-blue-800/30 border border-blue-400/20 rounded-xl p-8 backdrop-blur-sm max-w-md mx-auto"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Fish size={40} className="text-blue-300 mx-auto mb-3" />
                  <p className="text-blue-200 text-center">
                    {featuredProducts.length === 0
                      ? "Aún no hay productos destacados. El admin puede destacar productos desde el panel."
                      : error}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {featuredProducts.map((product, index) => (
                    <motion.div key={product.id}
                      className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-blue-400/20 hover:border-blue-300/40 transition-all duration-300"
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}>
                      <div className="flex flex-col items-center text-center">
                        <motion.div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-400/30 to-cyan-400/30 p-3 mb-6 flex items-center justify-center overflow-hidden shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}>
                          {product.imagen
                            ? <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover rounded-xl" onError={e => { e.target.style.display='none' }} />
                            : <Fish size={40} className="text-blue-300" />}
                        </motion.div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">{product.nombre}</h3>
                        <div className="text-2xl font-bold text-cyan-300 mb-4">
                          Bs. {parseFloat(product.precio || 0).toFixed(2)}/kg
                        </div>
                        <motion.button
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center space-x-2 font-medium shadow-lg"
                          whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleExplore}>
                          <ShoppingBag size={18} /><span>Ver detalles</span>
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

      {/* Botón flotante */}
      <motion.div className="fixed bottom-8 right-8 z-20"
        initial={{ opacity: 0, scale: 0.5, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6, type: "spring" }}>
        <motion.button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-4 shadow-2xl relative"
          whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.9 }}
          animate={{ y: [0,-5,0] }} transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
          <Phone size={24} />
          <motion.div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full"
            animate={{ scale: [1,1.3,1], opacity: [1,0.7,1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        </motion.button>
      </motion.div>
    </div>
  )
}

export default WelcomeHome