"use client"

import { useState, useEffect } from "react"
import { API_ENDPOINTS } from "../../config/apiConfig";
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Truck,
  Phone,
  Mail,
  Clock,
  ShoppingCart,
  Heart,
  Fish,
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  X,
  Package,
  Globe,
  Instagram,
  Facebook,
  Share2,
  Ribbon,
} from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import { useTheme } from "../../contexts/ThemeContext"

// Importar servicios
import { agregarAlCarrito, obtenerCarrito, actualizarCantidadCarrito, eliminarDelCarrito } from "../../api/services/carrito.service";

const PerfilProductorConsumidor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { D, isDark } = useTheme()
  
  // Estados principales
  const [producer, setProducer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estados de interfaz
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [galeriaCategoria, setGaleriaCategoria] = useState("general")
  const [cart, setCart] = useState({})
  const [favorites, setFavorites] = useState(new Set())
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // Estados del modal de reserva (nuevo flujo /api/reservas con calendario)
  const [reservationData, setReservationData] = useState({
    mensaje: '', cantidad: '1', fecha: '', hora: '', es_cocinado: false,
  })
  const [reservationLoading, setReservationLoading] = useState(false)
  const [reservationSuccess, setReservationSuccess] = useState(false)
  const [reservaError, setReservaError] = useState(null)

  // Calendario mensual de reservas (visible en el perfil, antes de elegir producto)
  const [calCursor, setCalCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [calDias, setCalDias] = useState([]) // respuesta del backend para el rango visible
  const [calLoading, setCalLoading] = useState(false)
  const [fechaPreseleccionada, setFechaPreseleccionada] = useState('')

  // Estados para reseñas
  const [opiniones, setOpiniones] = useState({})
  const [selectedProductoReview, setSelectedProductoReview] = useState(null)
  const [opinionForm, setOpinionForm] = useState({ calificacion: 0, comentario: '' })
  const [enviandoOpinion, setEnviandoOpinion] = useState(false)

  // Estados para sincronización con backend
  const [carritoBackend, setCarritoBackend] = useState({ items: [], total: 0 })
  const [syncingCart, setSyncingCart] = useState(false)

  // Modal de detalle de producto
  const [detailProduct, setDetailProduct] = useState(null)

  // Cargar datos del productor
  const fetchProducerData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔄 Cargando datos del productor ID: ${id}`)

      // ✅ CORREGIDO: Agregar [ ] y corregir barra
      const [resProducer, resProductos] = await Promise.all([
        fetch(API_ENDPOINTS.PRODUCTORES.BY_ID(id)),
        fetch(`${API_ENDPOINTS.PRODUCTORES.BY_ID(id)}/productos`)  
      ])

      if (!resProducer.ok) {
        if (resProducer.status === 404) {
          throw new Error("Productor no encontrado")
        }
        throw new Error(`Error ${resProducer.status}: ${resProducer.statusText}`)
      }

      if (!resProductos.ok) {
        console.warn("⚠️ No se pudieron cargar los productos del productor")
      }

      const productorResponse = await resProducer.json()
      const productor = productorResponse.data || productorResponse
      
      const productosResponse = await resProductos.json()
      const productos = productosResponse.data || productosResponse || []

      console.log("✅ Datos del productor cargados:", productor)
      console.log("✅ Productos cargados:", productos)

      // Procesar y estructurar los datos
      // Helper para parsear JSONB que puede llegar como string o array
      const parseJsonb = (val, fallback = []) => {
        if (!val) return fallback
        if (Array.isArray(val)) return val
        if (typeof val === 'object') return val
        try { return JSON.parse(val) } catch { return fallback }
      }

      const horarioFmt = (() => {
        const ini = productor.horario_atencion_inicio
        const fin = productor.horario_atencion_fin
        if (ini && fin) return `${ini} – ${fin}`
        if (ini) return `Desde ${ini}`
        return null
      })()

      const producerData = {
        ...productor,
        productos: Array.isArray(productos) ? productos : [],
        certificaciones: parseJsonb(productor.certificaciones, []),
        galeria_criadero: parseJsonb(productor.galeria_criadero, []),
        dias_venta: parseJsonb(productor.dias_venta, {}),
        dias_envio: parseJsonb(productor.dias_envio, {}),
        metodos_envio: parseJsonb(productor.metodos_envio, []),
        especialidad: parseJsonb(productor.especialidad, []),
        foto_perfil: productor.foto_perfil || null,
        foto_portada: productor.foto_portada || null,
        ciudad: productor.ciudad || productor.ubicacion || null,
        years_experience: parseInt(productor.years_experience) || 0,
        rating: parseFloat(productor.calificacion_promedio || productor.rating) || 0,
        total_reviews: parseInt(productor.total_reviews) || 0,
        productos_vendidos: parseInt(productor.productos_count) || 0,
        horario_atencion: horarioFmt,
        descripcion: productor.descripcion || null,
        sitio_web: productor.sitio_web || null,
        instagram: productor.instagram || null,
        facebook: productor.facebook || null,
      }

      setProducer(producerData)

    } catch (err) {
      console.error("❌ Error al cargar datos del productor:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchProducerData()
    }
  }, [id])

  // Cargar calendario del rango visible (6 semanas alrededor del mes actual del cursor)
  useEffect(() => {
    if (!id) return
    const cargarCalendario = async () => {
      setCalLoading(true)
      try {
        // primer lunes visible (retrocede al lunes)
        const desde = new Date(calCursor)
        desde.setDate(1)
        const dow = (desde.getDay() + 6) % 7
        desde.setDate(desde.getDate() - dow)
        // 42 días = 6 semanas
        const hasta = new Date(desde)
        hasta.setDate(hasta.getDate() + 41)

        const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        const r = await fetch(`${API_ENDPOINTS.PRODUCTORES.BY_ID(id)}/calendario?desde=${ymd(desde)}&hasta=${ymd(hasta)}`, {
          credentials: 'include',
        })
        const j = await r.json()
        setCalDias(j.data || [])
      } catch {
        setCalDias([])
      } finally {
        setCalLoading(false)
      }
    }
    cargarCalendario()
  }, [id, calCursor])

  // Cargar carrito del backend al montar el componente
  useEffect(() => {
    const cargarCarritoBackend = async () => {
      try {
        const carritoData = await obtenerCarrito()
        setCarritoBackend(carritoData)
        
        // Convertir formato backend a formato local para compatibilidad
        const carritoLocal = {}
        if (carritoData.items) {
          carritoData.items.forEach(item => {
            carritoLocal[item.producto_id] = item.cantidad
          })
        }
        setCart(carritoLocal)
        
        console.log('✅ Carrito cargado del backend:', carritoData)
      } catch (error) {
        console.error('❌ Error al cargar carrito del backend:', error)
        // Usar localStorage como fallback
        cargarCarritoLocal()
      }
    }

    cargarCarritoBackend()
  }, [])

  const cargarCarritoLocal = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      const savedFavorites = localStorage.getItem('favorites')
      
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
      
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.error("Error al cargar datos del localStorage:", error)
    }
  }

  // Cargar favoritos del localStorage al montar el componente
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('favorites')
      
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.error("Error al cargar favoritos del localStorage:", error)
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch (error) {
      console.error("Error al guardar carrito:", error)
    }
  }, [cart])

  // Guardar favoritos en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('favorites', JSON.stringify([...favorites]))
    } catch (error) {
      console.error("Error al guardar favoritos:", error)
    }
  }, [favorites])

  useEffect(() => {
    if (producer?.productos?.length > 0 && !selectedProductoReview) {
      setSelectedProductoReview(producer.productos[0].id)
    }
  }, [producer])

  useEffect(() => {
    if (selectedProductoReview && opiniones[selectedProductoReview] === undefined) {
      fetchOpinionesProducto(selectedProductoReview)
    }
  }, [selectedProductoReview])

  const diasSemana = [
    { key: "lunes", label: "L", name: "Lunes" },
    { key: "martes", label: "M", name: "Martes" },
    { key: "miercoles", label: "M", name: "Miércoles" },
    { key: "jueves", label: "J", name: "Jueves" },
    { key: "viernes", label: "V", name: "Viernes" },
    { key: "sabado", label: "S", name: "Sábado" },
    { key: "domingo", label: "D", name: "Domingo" },
  ]

  // Funciones del carrusel
  const nextImage = () => {
    if (producer?.galeria_criadero?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % producer.galeria_criadero.length)
    }
  }

  const prevImage = () => {
    if (producer?.galeria_criadero?.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + producer.galeria_criadero.length) % producer.galeria_criadero.length)
    }
  }

  // Funciones del carrito
  const updateCart = (productId, quantity) => {
    setCart((prev) => {
      const newCart = { ...prev }
      if (quantity <= 0) {
        delete newCart[productId]
      } else {
        newCart[productId] = quantity
      }
      return newCart
    })
  }

  // Función para agregar directo al carrito (integrado con backend PostgreSQL)
  const handleAddToCart = async (producto) => {
    try {
      setSyncingCart(true)
      
      // Validar disponibilidad y stock
      if (!producto.disponible) {
        alert("Este producto no está disponible")
        return
      }

      const currentQuantity = cart[producto.id] || 0
      if (currentQuantity >= producto.stock) {
        alert("No hay más stock disponible")
        return
      }

      console.log(`🛒 Agregando ${producto.nombre} al carrito...`)

      // Agregar al carrito usando tu API PostgreSQL existente
      await agregarAlCarrito(producto.id, 1)
      
      console.log(`✅ ${producto.nombre} agregado al carrito exitosamente`)
      
      // Recargar carrito para obtener estado actualizado
      const carritoActualizado = await obtenerCarrito()
      
      // Actualizar carrito local para la UI
      const carritoLocal = {}
      if (carritoActualizado.items) {
        carritoActualizado.items.forEach(item => {
          carritoLocal[item.producto_id] = item.cantidad
        })
      }
      setCart(carritoLocal)
      setCarritoBackend(carritoActualizado)
      
      // Mostrar confirmación visual
      alert(`${producto.nombre} agregado al carrito`)
      
    } catch (error) {
      console.error("❌ Error al agregar al carrito:", error)
      
      if (error.message.includes('AUTH_REQUIRED')) {
        alert("Debes iniciar sesión para agregar productos al carrito")
      } else {
        alert("Hubo un error al añadir al carrito. Intenta nuevamente.")
      }
    } finally {
      setSyncingCart(false)
    }
  }

  // Función para actualizar cantidad (compatible con tu API PostgreSQL)
  const updateCartBackend = async (productId, newQuantity) => {
    try {
      setSyncingCart(true)
      
      // Para tu API actual, necesitamos el ID del item del carrito, no del producto
      // Primero obtenemos el carrito actual para encontrar el item correcto
      const carritoActual = await obtenerCarrito()
      const item = carritoActual.items.find(item => item.producto_id === productId)
      
      if (!item) {
        console.error("Item no encontrado en el carrito")
        return
      }
      
      if (newQuantity <= 0) {
        await eliminarDelCarrito(item.id)
      } else {
        await actualizarCantidadCarrito(item.id, newQuantity)
      }
      
      // Recargar carrito después de la actualización
      const carritoActualizado = await obtenerCarrito()
      setCarritoBackend(carritoActualizado)
      
      const carritoLocal = {}
      if (carritoActualizado.items) {
        carritoActualizado.items.forEach(item => {
          carritoLocal[item.producto_id] = item.cantidad
        })
      }
      setCart(carritoLocal)
      
    } catch (error) {
      console.error("❌ Error al actualizar carrito:", error)
      // Fallback a función local en caso de error
      updateCart(productId, newQuantity)
    } finally {
      setSyncingCart(false)
    }
  }

  const addToCart = async (producto) => {
    const currentQuantity = cart[producto.id] || 0
    if (currentQuantity < producto.stock && producto.disponible) {
      // Usar función con backend
      await updateCartBackend(producto.id, currentQuantity + 1)
    }
  }

  const removeFromCart = async (productId) => {
    const currentQuantity = cart[productId] || 0
    if (currentQuantity > 0) {
      // Usar función con backend
      await updateCartBackend(productId, currentQuantity - 1)
    }
  }

  const getTotalItems = () => {
    // Usar datos del backend si están disponibles
    if (carritoBackend.items && carritoBackend.items.length > 0) {
      return carritoBackend.items.reduce((sum, item) => sum + item.cantidad, 0)
    }
    // Fallback a carrito local
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  }

  const getTotalPrice = () => {
    // Usar datos del backend si están disponibles
    if (carritoBackend.total !== undefined) {
      return carritoBackend.total
    }
    // Fallback a cálculo local
    if (!producer?.productos) return 0
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = producer.productos.find((p) => p.id === parseInt(productId))
      return total + (product ? product.precio * quantity : 0)
    }, 0)
  }

  // Funciones de favoritos
  const toggleFavorite = (productId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
        console.log(`💔 Producto ${productId} removido de favoritos`)
      } else {
        newFavorites.add(productId)
        console.log(`❤️ Producto ${productId} agregado a favoritos`)
      }
      return newFavorites
    })
  }

  // Flujo unificado: "Reservar" agrega el producto a la reserva (carrito) y lleva
  // al flujo de reserva con calendario — un solo flujo, un solo código (igual que la app).
  const handleReservation = async (producto) => {
    try {
      if ((producto.stock ?? 1) <= 0) { alert('Producto sin stock'); return }
      await agregarAlCarrito(producto.id, 1)
      navigate('/dashboard-consumidor/carrito')
    } catch (e) {
      alert('No se pudo agregar a la reserva')
    }
  }

  const submitReservation = async () => {
    if (!selectedProduct) return
    if (!reservationData.fecha) { setReservaError('Selecciona una fecha disponible'); return }
    const cantidad = parseFloat(reservationData.cantidad)
    if (!Number.isFinite(cantidad) || cantidad <= 0) { setReservaError('Cantidad inválida'); return }

    try {
      setReservationLoading(true)
      setReservaError(null)
      const productorId = selectedProduct.productor_id || productor?.id
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reservas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productor_id: productorId,
          producto_id:  selectedProduct.id,
          cantidad,
          fecha_reserva: reservationData.fecha,
          hora_reserva:  reservationData.hora || null,
          es_cocinado:   reservationData.es_cocinado,
          notas:         reservationData.mensaje.trim() || null,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.message || 'Error al crear la reserva')
      setReservationSuccess(true)
    } catch (error) {
      setReservaError(error.message || 'Error al procesar la reserva')
    } finally {
      setReservationLoading(false)
    }
  }

  const closeReservationModal = () => {
    setShowReservationModal(false)
    setSelectedProduct(null)
    setReservationData({ mensaje: '' })
    setReservationSuccess(false)
    setFechaPreseleccionada('')
  }

  // Click en un chip de "Próximas fechas": si hay 1 sólo producto reservable, abre directo el modal;
  // si hay varios, guarda la fecha y hace scroll a la sección de productos.
  const handleClickFecha = (fecha) => {
    setFechaPreseleccionada(fecha)
    const reservables = (producer?.productos || []).filter(p => p.disponible !== false && (p.stock ?? 1) > 0)
    if (reservables.length === 1) {
      handleReservation(reservables[0])
      return
    }
    const el = document.getElementById('seccion-productos')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fetchOpinionesProducto = async (productoId) => {
    try {
      const res = await fetch(API_ENDPOINTS.OPINIONES.POR_PRODUCTO(productoId))
      const json = await res.json()
      setOpiniones(prev => ({ ...prev, [productoId]: json.data || [] }))
    } catch { /* silent */ }
  }

  const submitOpinion = async (productoId) => {
    if (!opinionForm.calificacion) {
      alert('Selecciona una calificación (1–5 estrellas)')
      return
    }
    setEnviandoOpinion(true)
    try {
      const res = await fetch(API_ENDPOINTS.OPINIONES.CREAR, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: productoId,
          calificacion: opinionForm.calificacion,
          comentario: opinionForm.comentario.trim() || null,
        }),
      })
      if (res.ok) {
        alert('¡Reseña publicada correctamente!')
        setOpinionForm({ calificacion: 0, comentario: '' })
        fetchOpinionesProducto(productoId)
      } else {
        const err = await res.json()
        alert(err.message || 'Error al publicar la reseña')
      }
    } catch {
      alert('Error al publicar la reseña. Intenta nuevamente.')
    } finally {
      setEnviandoOpinion(false)
    }
  }

  // Función para ir al carrito
  const goToCart = () => {
    navigate("/dashboard-consumidor/carrito")
  }

  // Función para volver atrás
  const goBack = () => {
    navigate("/dashboard-consumidor/productores")
  }

  // Estados de carga y error
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: `4px solid ${D.primary}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 6 }}>Cargando perfil del productor</h3>
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
          <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>Error al cargar el productor</h3>
          <p style={{ color: D.muted, marginBottom: 24 }}>{error}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={goBack} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: D.surface, color: D.muted, border: `1px solid ${D.border}`, cursor: 'pointer', fontWeight: 600 }}>
              Volver atrás
            </button>
            <button onClick={fetchProducerData} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={16} /> Reintentar
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!producer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg }}>
        <div style={{ textAlign: 'center' }}>
          <Fish style={{ width: 80, height: 80, color: D.dim, margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: D.text, marginBottom: 8 }}>Productor no encontrado</h2>
          <p style={{ color: D.muted, marginBottom: 24 }}>El productor que buscas no existe o ha sido eliminado.</p>
          <button onClick={goBack} style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={16} /> Volver a productores
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', background: D.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>

      {/* ── Header / Banner ── */}
      <div className="relative text-white overflow-hidden" style={{ minHeight: 260 }}>

        {/* Cover image or gradient base */}
        {producer.foto_portada ? (
          <img src={producer.foto_portada} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}

        {/* Overlay — always dark for hero readability */}
        <div className="absolute inset-0" style={{
          background: producer.foto_portada
            ? 'linear-gradient(180deg, rgba(6,13,31,0.55) 0%, rgba(6,13,31,0.80) 60%, rgba(6,13,31,0.98) 100%)'
            : isDark
              ? 'linear-gradient(135deg, #071228 0%, #0a1a38 40%, #061528 70%, #04101e 100%)'
              : 'linear-gradient(135deg, #15803d 0%, #0c4a6e 40%, #065f46 70%, #15803d 100%)',
        }} />

        {/* Ambient glow orbs */}
        <div className="absolute pointer-events-none"
          style={{ top: -60, right: '10%', width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 65%)', filter: 'blur(32px)' }} />
        <div className="absolute pointer-events-none"
          style={{ bottom: -40, left: '5%', width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 65%)', filter: 'blur(28px)' }} />
        <div className="absolute pointer-events-none"
          style={{ top: '30%', left: '35%', width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)', filter: 'blur(24px)' }} />

        {/* Top shimmer line */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(34,197,94,0.7) 40%, rgba(34,197,94,0.5) 60%, transparent 95%)' }} />

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 inset-x-0 h-20"
          style={{ background: `linear-gradient(to bottom, transparent, ${D.bg})` }} />

        {/* Content */}
        <div className="relative px-4 pt-5 pb-10">
          <div className="flex items-center justify-between mb-5">
            <button onClick={goBack}
              className="inline-flex items-center gap-1.5 text-sm transition-all px-3 py-1.5 rounded-lg"
              style={{ color: 'rgba(226,232,240,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(226,232,240,0.7)'}>
              <ArrowLeft size={16} />
              Volver a productores
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: producer.nombre_empresa || producer.nombre, text: `Conoce a ${producer.nombre_empresa || producer.nombre} en NaturaPiscis`, url: window.location.href })
                } else {
                  navigator.clipboard.writeText(window.location.href).then(() => alert('Enlace copiado al portapapeles'))
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm transition-all px-3 py-1.5 rounded-lg"
              style={{ color: 'rgba(226,232,240,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(226,232,240,0.7)'}>
              <Share2 size={15} />
              Compartir
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden"
                style={{
                  border: '2px solid rgba(34,197,94,0.5)',
                  boxShadow: '0 0 0 4px rgba(34,197,94,0.12), 0 8px 32px rgba(0,0,0,0.5)',
                }}>
                {producer.foto_perfil ? (
                  <img src={producer.foto_perfil} alt={producer.nombre} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                ) : null}
                <div className="w-full h-full items-center justify-center text-3xl font-bold"
                  style={{ display: producer.foto_perfil ? 'none' : 'flex',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.15))', color: '#22C55E' }}>
                  {producer.nombre?.charAt(0)?.toUpperCase() || 'P'}
                </div>
              </div>
              {producer.is_available_today && (
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                  Disponible
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1">
                {producer.verificado && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}>
                    <Award size={10} /> Verificado
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-1" style={{ color: '#f1f5f9', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                {producer.nombre}
              </h1>
              {producer.nombre_empresa && producer.nombre_empresa !== 'no hay' && (
                <p className="text-base mb-3" style={{ color: '#22C55E' }}>{producer.nombre_empresa}</p>
              )}

              {/* Info chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {producer.ciudad && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1' }}>
                    <MapPin size={11} style={{ color: '#22C55E' }} />
                    {producer.ciudad}
                  </span>
                )}
                {producer.years_experience > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1' }}>
                    <Clock size={11} style={{ color: '#22C55E' }} />
                    {producer.years_experience} años
                  </span>
                )}
                {producer.especialidad && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1' }}>
                    <Fish size={11} style={{ color: '#c084fc' }} />
                    {producer.especialidad}
                  </span>
                )}
              </div>

              {/* Rating + ventas */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <Star size={14} fill="#fbbf24" style={{ color: '#fbbf24' }} />
                  <span className="font-bold text-sm" style={{ color: '#fbbf24' }}>{producer.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-xs" style={{ color: 'rgba(251,191,36,0.7)' }}>({producer.total_reviews} reseñas)</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
                  <Package size={14} style={{ color: '#22C55E' }} />
                  <span>{producer.productos_vendidos?.toLocaleString() || 0} vendidos</span>
                </div>
              </div>
            </div>

            {/* Mini carrito */}
            {getTotalItems() > 0 && (
              <motion.div className="rounded-2xl p-4 flex-shrink-0"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  minWidth: 140,
                }}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="text-center">
                  <ShoppingCart size={22} style={{ color: '#22C55E', margin: '0 auto 6px' }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{getTotalItems()} productos</div>
                  <div className="font-bold text-white mb-2">Bs{getTotalPrice().toFixed(2)}</div>
                  <button onClick={goToCart}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', color: '#fff' }}>
                    Ver Carrito
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Columna principal ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Acerca del Productor */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: D.card,
                border: `1px solid ${D.border}`,
              }}>
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${D.primary}55, transparent)` }} />
              <h2 className="text-lg font-bold mb-4" style={{ color: D.text }}>Acerca del Productor</h2>
              {producer.descripcion
                ? <p className="leading-relaxed text-sm" style={{ color: D.muted }}>{producer.descripcion}</p>
                : <p className="leading-relaxed text-sm italic" style={{ color: D.dim }}>Este productor aún no ha agregado una descripción.</p>
              }
              {producer.certificaciones.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold mb-3 text-sm flex items-center gap-1.5" style={{ color: D.text }}>
                    <Award size={14} style={{ color: D.green }} />Certificaciones
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {producer.certificaciones.map((cert, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                        style={{ background: 'rgba(74,222,128,0.12)', color: D.green, border: '1px solid rgba(74,222,128,0.25)' }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Especialidades */}
              {producer.especialidad?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-3 text-sm flex items-center gap-1.5" style={{ color: D.text }}>
                    <Fish size={14} style={{ color: D.primary }} />Especialidades
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {producer.especialidad.map((esp, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(34,197,94,0.1)', color: D.primary, border: '1px solid rgba(34,197,94,0.25)' }}>
                        {esp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Galería del Criadero */}
            {producer.galeria_criadero?.length > 0 && (() => {
              const categoriasGaleria = [
                { id: "general",      label: "Criadero",    icono: "🏞️" },
                { id: "alimentacion", label: "Alimentación", icono: "🐟" },
                { id: "captura",      label: "Captura",      icono: "🎣" },
                { id: "preparacion",  label: "Preparación",  icono: "🔪" },
              ]
              const categoriasConItems = categoriasGaleria.filter(cat =>
                producer.galeria_criadero.some(i => (i.categoria || "general") === cat.id)
              )
              const itemsActivos = producer.galeria_criadero.filter(
                i => (i.categoria || "general") === galeriaCategoria
              )
              return (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="rounded-2xl p-6 relative overflow-hidden"
                  style={{
                    background: D.card,
                    border: `1px solid ${D.border}`,
                  }}>
                  <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${D.primary}55, transparent)` }} />
                  <h2 className="text-lg font-bold mb-4" style={{ color: D.text }}>Galería del Criadero</h2>
                  {/* Tabs */}
                  <div className="flex mb-5 overflow-x-auto gap-2 pb-1"
                    style={{ borderBottom: `1px solid ${D.border}` }}>
                    {categoriasConItems.map(cat => (
                      <button key={cat.id} onClick={() => setGaleriaCategoria(cat.id)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-all"
                        style={galeriaCategoria === cat.id
                          ? { background: 'rgba(34,197,94,0.15)', color: D.primary, border: '1px solid rgba(34,197,94,0.3)' }
                          : { color: D.muted, border: '1px solid transparent' }}>
                        <span>{cat.icono}</span><span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Grid */}
                  {itemsActivos.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center gap-2">
                      <Fish size={36} style={{ color: D.dim, opacity: 0.5 }} />
                      <p className="text-sm" style={{ color: D.dim }}>Sin contenido en esta sección</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {itemsActivos.map((item, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden aspect-square group"
                          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                          {item.tipo === "video" ? (
                            <video src={item.url} className="w-full h-full object-cover" muted playsInline
                              onMouseEnter={e => e.target.play()}
                              onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }} />
                          ) : (
                            <img src={item.url} alt={item.titulo || "Galería"} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                          )}
                          {item.titulo && (
                            <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.8),transparent)' }}>
                              <p className="text-white text-xs font-medium truncate">{item.titulo}</p>
                            </div>
                          )}
                          {item.tipo === "video" && (
                            <div className="absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none"
                              style={{ background: 'rgba(0,0,0,0.6)' }}>🎬 Video</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })()}

            {/* Productos Disponibles */}
            <motion.div id="seccion-productos" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
              className="rounded-2xl p-6"
              style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: D.text }}>Productos Disponibles</h2>
              {fechaPreseleccionada && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: D.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarDays size={14} />Fecha pre-seleccionada: {new Date(fechaPreseleccionada + 'T00:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                  <button onClick={() => setFechaPreseleccionada('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: D.muted, fontSize: 12, fontWeight: 600 }}>
                    Quitar
                  </button>
                </div>
              )}

              {/* Nota peso mínimo — solo si hay productos por kilo */}
              {producer.productos.some(p => ['kg','Kg','KG'].includes(p.unidad)) && (
                <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
                  style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.25)' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚖️</span>
                  <p className="text-sm leading-relaxed" style={{ color: D.orange, margin: 0 }}>
                    <strong>Productos por kilo:</strong> se venden desde <strong>800g en adelante</strong>. El precio mostrado es referencial — el productor pesa el producto y confirma el total exacto antes de que se genere el cobro.
                  </p>
                </div>
              )}

              {producer.productos.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <Package size={28} style={{ color: 'rgba(34,197,94,0.4)' }} />
                  </div>
                  <p style={{ color: D.muted }}>Este productor aún no ha agregado productos.</p>
                </div>
              ) : (
                <>
                  {/* Grid de tarjetas cuadradas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 14 }}>
                    {[...producer.productos]
                      .sort((a, b) => (b.disponible && b.stock > 0 ? 1 : 0) - (a.disponible && a.stock > 0 ? 1 : 0))
                      .map(producto => {
                        const agotado = !producto.disponible || producto.stock <= 0
                        const esPorKg = ['kg','Kg','KG'].includes(producto.unidad)
                        return (
                          <motion.div key={producto.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5, boxShadow: '0 14px 36px rgba(34,197,94,0.14)' }}
                            onClick={() => setDetailProduct(producto)}
                            style={{
                              borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                              background: isDark ? 'rgba(255,255,255,0.03)' : D.surface,
                              border: '1px solid rgba(34,197,94,0.1)',
                              opacity: agotado ? 0.75 : 1,
                              transition: 'border-color 0.2s',
                            }}>
                            {/* imagen cuadrada */}
                            <div style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', background: 'rgba(34,197,94,0.04)' }}>
                              {(producto.foto_principal || producto.imagen)
                                ? <img src={producto.foto_principal || producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={32} style={{ color: 'rgba(34,197,94,0.22)' }} />
                                  </div>
                              }
                              {agotado && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)' }}>
                                  <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.78)', color: '#fff', fontSize: 10, fontWeight: 800 }}>Agotado</span>
                                </div>
                              )}
                              {esPorKg && !agotado && (
                                <div style={{ position: 'absolute', bottom: 7, left: 7, padding: '2px 7px', borderRadius: 8, fontSize: 9, fontWeight: 700, background: 'rgba(251,146,60,0.22)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.4)' }}>
                                  ⚖ x kilo
                                </div>
                              )}
                            </div>
                            {/* footer */}
                            <div style={{ padding: '10px 11px 11px' }}>
                              <p style={{ fontWeight: 600, fontSize: 13, color: D.text, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {producto.nombre}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                                <div>
                                  <span style={{ fontWeight: 800, fontSize: 14, color: agotado ? D.dim : D.primary }}>
                                    Bs {parseFloat(producto.precio).toFixed(2)}
                                  </span>
                                  {producto.unidad && <span style={{ fontSize: 10, color: D.muted, marginLeft: 3 }}>/{producto.unidad}</span>}
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); !agotado && !syncingCart && handleAddToCart(producto) }}
                                  disabled={agotado || syncingCart}
                                  style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: agotado ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${D.primary},#15803d)`,
                                    border: 'none', cursor: agotado ? 'default' : 'pointer',
                                    boxShadow: agotado ? 'none' : '0 0 10px rgba(34,197,94,0.25)' }}>
                                  <ShoppingCart size={13} color={agotado ? D.dim : '#fff'} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    }
                  </div>

                  {/* Modal de detalle */}
                  <AnimatePresence>
                    {detailProduct && (() => {
                      const p = detailProduct
                      const agotado = !p.disponible || p.stock <= 0
                      const esPorKg = ['kg','Kg','KG'].includes(p.unidad)
                      return (
                        <motion.div key="detail-overlay"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={() => setDetailProduct(null)}
                          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 24 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: isDark ? '#0a1220' : D.card, border: `1px solid ${D.border}`, borderRadius: 24, overflow: 'hidden', maxWidth: 520, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
                            {/* imagen */}
                            <div style={{ position: 'relative', height: 280, background: 'rgba(34,197,94,0.04)' }}>
                              {(p.foto_principal || p.imagen)
                                ? <img src={p.foto_principal || p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={64} style={{ color: 'rgba(34,197,94,0.18)' }} />
                                  </div>
                              }
                              <button onClick={() => setDetailProduct(null)}
                                style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>
                                ✕
                              </button>
                              {agotado && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.42)' }}>
                                  <span style={{ padding: '8px 22px', borderRadius: 20, background: 'rgba(239,68,68,0.82)', color: '#fff', fontWeight: 800, fontSize: 16 }}>Agotado</span>
                                </div>
                              )}
                            </div>
                            {/* info */}
                            <div style={{ padding: '22px 24px 26px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: 0, lineHeight: 1.3 }}>{p.nombre}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                                  <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                    background: agotado ? 'rgba(248,113,113,0.14)' : 'rgba(74,222,128,0.14)',
                                    color: agotado ? '#f87171' : '#4ade80' }}>
                                    {agotado ? 'Sin stock' : `${p.stock} ${p.unidad || 'kg'} disponibles`}
                                  </span>
                                  {esPorKg && !agotado && (
                                    <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(251,146,60,0.14)', color: '#fb923c' }}>
                                      ⚖ por kilo · mín. 800g
                                    </span>
                                  )}
                                </div>
                              </div>
                              {p.descripcion && <p style={{ fontSize: 13, color: D.muted, lineHeight: 1.7, margin: '0 0 18px' }}>{p.descripcion}</p>}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                <div>
                                  <span style={{ fontSize: 30, fontWeight: 900, color: agotado ? D.dim : D.primary }}>
                                    Bs {parseFloat(p.precio).toFixed(2)}
                                  </span>
                                  {p.unidad && <span style={{ fontSize: 13, color: D.muted, marginLeft: 6 }}>/ {p.unidad}</span>}
                                </div>
                                {!agotado && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    {/* qty */}
                                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
                                      <button onClick={() => removeFromCart(p.id)}
                                        style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 20 }}>−</button>
                                      <span style={{ width: 34, textAlign: 'center', fontSize: 15, fontWeight: 700, color: D.text }}>{cart[p.id] || 0}</span>
                                      <button onClick={() => addToCart(p)}
                                        style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 20 }}>+</button>
                                    </div>
                                    {/* agregar */}
                                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                      onClick={() => handleAddToCart(p)} disabled={syncingCart}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: `linear-gradient(135deg,${D.primary},#15803d)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: syncingCart ? 0.7 : 1, boxShadow: '0 0 20px rgba(34,197,94,0.28)' }}>
                                      <ShoppingCart size={14} /> Agregar
                                    </motion.button>
                                    {/* reservar */}
                                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                      onClick={() => { setDetailProduct(null); handleReservation(p) }}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(74,222,128,0.2),rgba(34,197,94,0.15))', border: '1px solid rgba(74,222,128,0.35)', color: D.green, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                      <CalendarDays size={14} /> Reservar
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )
                    })()}
                  </AnimatePresence>
                </>
              )}
            </motion.div>

            {/* Reseñas de Productos */}
            {producer.productos.length > 0 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="rounded-2xl p-6"
                style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <h2 className="text-lg font-bold mb-5" style={{ color: D.text }}>Reseñas de Productos</h2>

                {producer.productos.length > 1 && (
                  <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {producer.productos.map(p => (
                      <button key={p.id} onClick={() => setSelectedProductoReview(p.id)}
                        className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-all"
                        style={selectedProductoReview === p.id
                          ? { background: 'rgba(34,197,94,0.15)', color: D.primary, border: '1px solid rgba(34,197,94,0.3)' }
                          : { color: D.muted, border: `1px solid ${D.border}` }}>
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                )}

                {selectedProductoReview && (() => {
                  const ops = opiniones[selectedProductoReview]
                  if (ops === undefined) {
                    return (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                        <div style={{ width: 24, height: 24, border: `3px solid ${D.border}`, borderTopColor: D.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    )
                  }
                  const avg = ops.length > 0 ? ops.reduce((s, o) => s + o.calificacion, 0) / ops.length : 0
                  return (
                    <>
                      {ops.length > 0 && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: D.surface }}>
                          <span className="text-3xl font-black" style={{ color: D.text }}>{avg.toFixed(1)}</span>
                          <div>
                            <div className="flex gap-0.5 mb-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={14} className={s <= Math.round(avg) ? 'fill-current' : ''} style={{ color: '#F59E0B' }} />
                              ))}
                            </div>
                            <p className="text-xs" style={{ color: D.muted }}>{ops.length} reseña{ops.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      )}

                      {ops.length === 0 ? (
                        <p className="text-sm mb-4 italic" style={{ color: D.muted }}>Aún no hay reseñas para este producto.</p>
                      ) : (
                        <div className="space-y-3 mb-5">
                          {ops.map(op => (
                            <div key={op.id} className="p-3 rounded-xl" style={{ background: D.surface, border: `1px solid ${D.border}` }}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
                                  style={{ background: D.primary + '20', color: D.primary }}>
                                  {op.foto_perfil
                                    ? <img src={op.foto_perfil} alt="" className="w-full h-full object-cover" />
                                    : op.usuario_nombre?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold" style={{ color: D.text }}>{op.usuario_nombre}</p>
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} size={11} className={s <= op.calificacion ? 'fill-current' : ''} style={{ color: '#F59E0B' }} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs" style={{ color: D.dim }}>
                                  {new Date(op.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                                </p>
                              </div>
                              {op.comentario && <p className="text-sm" style={{ color: D.muted }}>{op.comentario}</p>}
                              {op.respuesta && (
                                <div style={{ marginTop: 8, paddingLeft: 10, borderLeft: `2px solid ${D.primary}`, marginLeft: 2 }}>
                                  <p style={{ fontSize: 11, fontWeight: 600, color: D.primary, margin: '0 0 2px' }}>Respuesta del productor:</p>
                                  <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>{op.respuesta}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-4 rounded-xl" style={{ background: D.surface, border: `1px solid ${D.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <p className="text-sm font-bold" style={{ color: D.text, margin: 0 }}>Deja tu reseña</p>
                          <span style={{ fontSize: 10, color: D.dim, background: D.bg, padding: '2px 8px', borderRadius: 20, border: `1px solid ${D.border}` }}>
                            🔒 Solo compradores
                          </span>
                        </div>
                        <div className="flex gap-1.5 mb-3">
                          {[1,2,3,4,5].map(s => (
                            <button key={s} onClick={() => setOpinionForm(prev => ({ ...prev, calificacion: s }))}>
                              <Star size={26} className={s <= opinionForm.calificacion ? 'fill-current' : ''}
                                style={{ color: s <= opinionForm.calificacion ? '#F59E0B' : D.dim, transition: 'color 0.15s', display: 'block' }} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={2} maxLength={300}
                          value={opinionForm.comentario}
                          onChange={e => setOpinionForm(prev => ({ ...prev, comentario: e.target.value }))}
                          placeholder="Escribe un comentario (opcional)..."
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 10, resize: 'none', background: D.bg, border: `1px solid ${D.border}`, color: D.text, fontSize: 13, outline: 'none', lineHeight: 1.5, boxSizing: 'border-box', marginBottom: 10 }}
                          onFocus={e => e.target.style.borderColor = D.primary}
                          onBlur={e => e.target.style.borderColor = D.border}
                        />
                        <button onClick={() => submitOpinion(selectedProductoReview)}
                          disabled={enviandoOpinion || !opinionForm.calificacion}
                          style={{ padding: '8px 20px', borderRadius: 10, background: opinionForm.calificacion ? `linear-gradient(135deg,${D.primary},#15803d)` : D.dim, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: opinionForm.calificacion ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: enviandoOpinion ? 0.7 : 1 }}>
                          {enviandoOpinion
                            ? <><div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Publicando…</>
                            : 'Publicar reseña'}
                        </button>
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Contacto */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-5"
              style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <h3 className="font-bold mb-4 text-sm" style={{ color: D.text }}>Información de Contacto</h3>
              <div className="space-y-3">
                {producer.email && producer.mostrar_email !== false && (
                  <a href={`mailto:${producer.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: D.surface, border: `1px solid ${D.border}`, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = D.primary + '60'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                    <Mail size={16} style={{ color: D.primary, flexShrink: 0 }} />
                    <span className="text-sm break-all" style={{ color: D.text }}>{producer.email}</span>
                  </a>
                )}
                {producer.telefono && producer.mostrar_telefono !== false && (
                  <a href={`tel:${producer.telefono}`}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: D.surface, border: `1px solid ${D.border}`, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = D.primary + '60'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                    <Phone size={16} style={{ color: D.primary, flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: D.text }}>{producer.telefono}</span>
                  </a>
                )}
                {producer.horario_atencion && (
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: D.surface, border: `1px solid ${D.border}` }}>
                    <Clock size={16} style={{ color: D.primary, flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: D.text }}>{producer.horario_atencion}</span>
                  </div>
                )}
                {/* WhatsApp */}
                {producer.telefono && producer.mostrar_telefono !== false && (
                  <a href={`https://wa.me/591${producer.telefono.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.12)'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Contactar por WhatsApp
                  </a>
                )}
              </div>

              {/* Redes sociales */}
              {(producer.sitio_web || producer.instagram || producer.facebook) && (
                <div style={{ marginTop: 14 }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: D.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redes sociales</p>
                  <div className="flex flex-col gap-2">
                    {producer.sitio_web && (
                      <a href={producer.sitio_web} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.primary, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = D.primary}
                        onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                        <Globe size={15} /> {producer.sitio_web.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {producer.instagram && (
                      <a href={`https://instagram.com/${producer.instagram.replace('@','').replace(/.*instagram\.com\//,'')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(225,48,108,0.06)', border: '1px solid rgba(225,48,108,0.25)', color: '#e1306c', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#e1306c'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(225,48,108,0.25)'}>
                        <Instagram size={15} /> @{producer.instagram.replace('@','')}
                      </a>
                    )}
                    {producer.facebook && (
                      <a href={producer.facebook} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.25)', color: '#1877f2', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#1877f2'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(24,119,242,0.25)'}>
                        <Facebook size={15} /> Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Días de Venta */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-5"
              style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <h3 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color: D.text }}>
                <Calendar size={16} style={{ color: D.primary }} />Días de Venta
              </h3>
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {diasSemana.map(dia => {
                  // Soporta tanto objeto {lunes:true} como array ['lunes','martes']
                  const dv = producer.dias_venta
                  const active = Array.isArray(dv) ? dv.includes(dia.key) : !!(dv && dv[dia.key])
                  return (
                    <div key={dia.key} title={dia.name}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={active
                        ? { background: 'rgba(74,222,128,0.18)', color: D.green, border: '1px solid rgba(74,222,128,0.35)', boxShadow: '0 0 6px rgba(74,222,128,0.2)' }
                        : { background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, color: D.dim, border: `1px solid ${D.border}` }}>
                      {dia.label}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs" style={{ color: D.dim }}>Días disponibles para pedidos</p>

              {/* Calendario de reservas (mes navegable) */}
              <div style={{ marginTop: 16, borderTop: `1px solid ${D.border}`, paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: D.muted, margin: 0 }}>
                    <CalendarDays size={13} />Calendario de reservas
                  </p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                      style={{ padding: 4, borderRadius: 6, background: 'transparent', border: `1px solid ${D.border}`, cursor: 'pointer', color: D.muted, display: 'flex' }}>
                      <ChevronLeft size={12} />
                    </button>
                    <button onClick={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                      style={{ padding: 4, borderRadius: 6, background: 'transparent', border: `1px solid ${D.border}`, cursor: 'pointer', color: D.muted, display: 'flex' }}>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: D.text, margin: '0 0 8px', textTransform: 'capitalize' }}>
                  {calCursor.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                </p>

                {/* Cabecera L M X J V S D */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
                  {['L','M','X','J','V','S','D'].map((l, i) => (
                    <div key={i} style={{ textAlign: 'center', color: D.dim, fontSize: 9, fontWeight: 700, padding: '2px 0' }}>{l}</div>
                  ))}
                </div>

                {/* Grid de 42 días */}
                {calLoading ? (
                  <p style={{ fontSize: 11, color: D.dim, margin: '8px 0', textAlign: 'center' }}>Cargando…</p>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                      {(() => {
                        // Construye los 42 días del rango visible a partir de calDias
                        const desde = new Date(calCursor); desde.setDate(1)
                        const dow0 = (desde.getDay() + 6) % 7
                        desde.setDate(desde.getDate() - dow0)
                        const ymdStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                        const hoyStr = ymdStr(new Date())
                        const byFecha = new Map(calDias.map(d => [d.fecha, d]))
                        const cells = []
                        for (let i = 0; i < 42; i++) {
                          const dt = new Date(desde); dt.setDate(desde.getDate() + i)
                          const fecha = ymdStr(dt)
                          const enMes = dt.getMonth() === calCursor.getMonth()
                          const dia = byFecha.get(fecha)
                          const disponible = dia?.disponible === true
                          const esPasado  = fecha < hoyStr
                          const esHoy     = fecha === hoyStr
                          const sel = fechaPreseleccionada === fecha
                          const clickable = disponible && !esPasado
                          let bg = 'transparent', color = D.dim, border = `1px solid ${D.border}`
                          if (disponible && !esPasado) {
                            bg = sel ? 'rgba(34,197,94,0.32)' : 'rgba(34,197,94,0.14)'
                            color = '#22c55e'
                            border = sel ? '1.5px solid #22c55e' : '1px solid rgba(34,197,94,0.35)'
                          } else if (dia && !disponible) {
                            bg = 'rgba(239,68,68,0.10)'
                            color = '#ef4444'
                            border = '1px solid rgba(239,68,68,0.25)'
                          }
                          if (esHoy) border = `1.5px solid ${D.primary}`
                          cells.push(
                            <button key={fecha}
                              onClick={() => clickable && handleClickFecha(fecha)}
                              disabled={!clickable}
                              title={dia?.motivo || (disponible ? (dia?.cupo_restante != null ? `${dia.cupo_restante} cupos` : 'Disponible') : esPasado ? 'Fecha pasada' : 'No disponible')}
                              style={{
                                aspectRatio: '1 / 1', border, borderRadius: 6, background: bg, color,
                                fontSize: 11, fontWeight: esHoy ? 800 : 600,
                                cursor: clickable ? 'pointer' : 'default',
                                opacity: enMes ? (esPasado ? 0.4 : 1) : 0.25,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                padding: 0,
                              }}>
                              {dt.getDate()}
                              {dia?.cupo_restante != null && disponible && (
                                <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 7, fontWeight: 700, color: '#fbbf24' }}>{dia.cupo_restante}</span>
                              )}
                            </button>
                          )
                        }
                        return cells
                      })()}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 9, color: D.dim }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(34,197,94,0.4)' }} />Disponible
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(239,68,68,0.4)' }} />Bloqueado
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: 'transparent', border: `1px solid ${D.border}` }} />Inactivo
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: D.dim, margin: '8px 0 0', fontStyle: 'italic', textAlign: 'center' }}>
                      Toca un día verde para reservar
                    </p>
                  </>
                )}
              </div>

              {/* Métodos de envío */}
              {producer.metodos_envio?.length > 0 && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${D.border}`, paddingTop: 12 }}>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: D.muted }}>
                    <Truck size={13} />Métodos de envío
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {producer.metodos_envio.map((m, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(251,146,60,0.1)', color: D.orange, border: '1px solid rgba(251,146,60,0.25)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Resumen carrito */}
            {getTotalItems() > 0 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.2)' }}>
                <h3 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color: D.text }}>
                  <ShoppingCart size={16} style={{ color: D.primary }} />Tu Carrito
                </h3>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between" style={{ color: D.muted }}>
                    <span>Productos:</span>
                    <span className="font-semibold" style={{ color: D.text }}>{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-base"
                    style={{ borderTop: '1px solid rgba(34,197,94,0.1)', color: D.text }}>
                    <span>Total:</span>
                    <span style={{ color: D.primary }}>Bs{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={goToCart}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', boxShadow: '0 0 16px rgba(34,197,94,0.25)' }}>
                  Ir al carrito
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de Reserva ─────────────────────────────── */}
      {showReservationModal && selectedProduct && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={closeReservationModal}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, overflow: 'hidden', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Franja top */}
            <div style={{ height: 3, background: 'linear-gradient(90deg,#22C55E,#16a34a,#15803d)' }} />

            <div style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 4px' }}>
                    Reservar producto
                  </h3>
                  <p style={{ fontSize: 13, color: D.green, margin: 0, fontWeight: 600 }}>
                    {selectedProduct.nombre}
                  </p>
                </div>
                <button onClick={closeReservationModal}
                  style={{ padding: 6, borderRadius: 8, background: 'transparent', border: `1px solid ${D.border}`, cursor: 'pointer', color: D.muted, display: 'flex' }}>
                  <X size={17} />
                </button>
              </div>

              {reservationSuccess ? (
                /* ── Éxito ── */
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={28} style={{ color: '#4ade80' }} />
                  </div>
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: '0 0 8px' }}>¡Reserva enviada!</h4>
                  <p style={{ fontSize: 13, color: D.muted, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
                    El productor revisará tu solicitud y te confirmará el precio exacto. Tendrás <strong style={{ color: D.text }}>30 minutos</strong> para aceptar.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={closeReservationModal}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: D.surface, border: `1px solid ${D.border}`, color: D.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cerrar
                    </button>
                    <button onClick={() => { closeReservationModal(); navigate('/dashboard-consumidor/mis-reservas') }}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Ver mis reservas
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Formulario nuevo: calendario + cantidad ── */
                <>
                  {/* Info producto */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(74,222,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {(selectedProduct.foto_principal || selectedProduct.imagen)
                        ? <img src={selectedProduct.foto_principal || selectedProduct.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Package size={18} style={{ color: D.green }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0 }}>{selectedProduct.nombre}</p>
                      <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>Bs. {parseFloat(selectedProduct.precio).toFixed(2)} / kg</p>
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: D.muted, marginBottom: 4, fontWeight: 600 }}>Cantidad (kg) *</label>
                      <input type="number" min="0.5" step="0.5" value={reservationData.cantidad}
                        onChange={e => setReservationData(r => ({ ...r, cantidad: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: D.muted, marginBottom: 4, fontWeight: 600 }}>Hora preferida</label>
                      <input type="time" value={reservationData.hora}
                        onChange={e => setReservationData(r => ({ ...r, hora: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Calendario mensual */}
                  <label style={{ display: 'block', fontSize: 11, color: D.muted, marginBottom: 6, fontWeight: 600 }}>
                    Fecha de retiro * (toca un día verde)
                  </label>

                  {/* Header mes con flechas */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <button type="button" onClick={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                      style={{ padding: 6, borderRadius: 8, background: D.surface, border: `1px solid ${D.border}`, cursor: 'pointer', color: D.text, display: 'flex' }}>
                      <ChevronLeft size={14} />
                    </button>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: D.text, textTransform: 'capitalize' }}>
                      {calCursor.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                    </p>
                    <button type="button" onClick={() => setCalCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                      style={{ padding: 6, borderRadius: 8, background: D.surface, border: `1px solid ${D.border}`, cursor: 'pointer', color: D.text, display: 'flex' }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Cabecera L M X J V S D */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                    {['L','M','X','J','V','S','D'].map((l, i) => (
                      <div key={i} style={{ textAlign: 'center', color: D.dim, fontSize: 10, fontWeight: 700, padding: '4px 0' }}>{l}</div>
                    ))}
                  </div>

                  {/* Grid 6 semanas */}
                  {calLoading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: D.muted, fontSize: 12 }}>Cargando calendario…</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
                      {(() => {
                        const desde = new Date(calCursor); desde.setDate(1)
                        const dow0 = (desde.getDay() + 6) % 7
                        desde.setDate(desde.getDate() - dow0)
                        const ymdStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                        const hoyStr = ymdStr(new Date())
                        const byFecha = new Map(calDias.map(d => [d.fecha, d]))
                        const cells = []
                        for (let i = 0; i < 42; i++) {
                          const dt = new Date(desde); dt.setDate(desde.getDate() + i)
                          const fecha = ymdStr(dt)
                          const enMes = dt.getMonth() === calCursor.getMonth()
                          const dia = byFecha.get(fecha)
                          const disponible = dia?.disponible === true
                          const esPasado  = fecha < hoyStr
                          const esHoy     = fecha === hoyStr
                          const sel = reservationData.fecha === fecha
                          const clickable = disponible && !esPasado
                          let bg = 'transparent', color = D.dim, border = `1px solid ${D.border}`
                          if (disponible && !esPasado) {
                            bg = sel ? 'rgba(34,197,94,0.32)' : 'rgba(34,197,94,0.14)'
                            color = '#22c55e'
                            border = sel ? '1.5px solid #22c55e' : '1px solid rgba(34,197,94,0.35)'
                          } else if (dia && !disponible) {
                            bg = 'rgba(239,68,68,0.10)'
                            color = '#ef4444'
                            border = '1px solid rgba(239,68,68,0.25)'
                          }
                          if (esHoy) border = `1.5px solid ${D.primary}`
                          cells.push(
                            <button key={fecha} type="button"
                              onClick={() => clickable && setReservationData(r => ({ ...r, fecha }))}
                              disabled={!clickable}
                              title={dia?.motivo || (disponible ? (dia?.cupo_restante != null ? `${dia.cupo_restante} cupos` : 'Disponible') : esPasado ? 'Fecha pasada' : 'No disponible')}
                              style={{
                                aspectRatio: '1 / 1', border, borderRadius: 8, background: bg, color,
                                fontSize: 12, fontWeight: esHoy ? 800 : 600,
                                cursor: clickable ? 'pointer' : 'default',
                                opacity: enMes ? (esPasado ? 0.4 : 1) : 0.25,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                padding: 0,
                              }}>
                              {dt.getDate()}
                              {dia?.cupo_restante != null && disponible && (
                                <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: 8, fontWeight: 700, color: '#fbbf24' }}>{dia.cupo_restante}</span>
                              )}
                            </button>
                          )
                        }
                        return cells
                      })()}
                    </div>
                  )}

                  {/* Leyenda */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, fontSize: 10, color: D.dim }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(34,197,94,0.4)' }} />Disponible
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(239,68,68,0.4)' }} />Bloqueado
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: 'transparent', border: `1px solid ${D.border}` }} />Inactivo
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(251,191,36,0.4)' }} />Cupos
                    </span>
                  </div>

                  {/* Fecha seleccionada feedback */}
                  {reservationData.fecha && (
                    <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 12, fontSize: 12, color: '#22c55e', fontWeight: 600, textAlign: 'center', textTransform: 'capitalize' }}>
                      ✓ {new Date(reservationData.fecha + 'T00:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  )}

                  {/* Notas */}
                  <label style={{ display: 'block', fontSize: 11, color: D.muted, marginBottom: 4, fontWeight: 600 }}>Notas (opcional)</label>
                  <textarea rows={2} maxLength={200}
                    value={reservationData.mensaje}
                    onChange={e => setReservationData(r => ({ ...r, mensaje: e.target.value }))}
                    placeholder="Ej: prefiero pescados medianos"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, color: D.text, fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }} />

                  {reservaError && (
                    <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, color: D.red, fontSize: 12, marginBottom: 12 }}>
                      {reservaError}
                    </div>
                  )}

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={closeReservationModal} disabled={reservationLoading}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: D.surface, border: `1px solid ${D.border}`, color: D.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button type="button" onClick={submitReservation}
                      disabled={reservationLoading || !reservationData.fecha}
                      style={{ flex: 1.6, padding: '11px 0', borderRadius: 12,
                        background: !reservationData.fecha ? D.dim : 'linear-gradient(135deg,#22c55e,#16a34a)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: reservationData.fecha ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {reservationLoading
                        ? <>Enviando…</>
                        : <><CalendarDays size={15} /> Enviar reserva</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default PerfilProductorConsumidor