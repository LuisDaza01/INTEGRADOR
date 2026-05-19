import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Calendar, CheckCircle, Clock, Eye, Gift, Heart, Minus,
  Package, Plus, ShoppingCart, Zap
} from "lucide-react"
import { agregarAlCarrito as agregarAlCarritoService } from "../../api/services/carrito.service"  // ✅

const TarjetaProductoMultiBotones = ({ producto, onReservar, onVerDetalle, onToggleFavorite, onCarritoUpdate }) => {
  const [cantidad, setCantidad] = useState(1)
  const [agregandoCarrito, setAgregandoCarrito] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [esFavorito, setEsFavorito] = useState(producto.esFavorito || false)

  const handleCantidadChange = (delta) => {
    const nuevaCantidad = cantidad + delta
    if (nuevaCantidad >= 1 && nuevaCantidad <= producto.stock) {
      setCantidad(nuevaCantidad)
    }
  }

  const handleAgregarAlCarrito = async (isQuickAdd = false) => {
    try {
      setAgregandoCarrito(true)
      const cantidadFinal = isQuickAdd ? 1 : cantidad
      await agregarAlCarritoService(producto.id, cantidadFinal)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 2500)
      if (onCarritoUpdate) onCarritoUpdate()
      if (isQuickAdd) setCantidad(1)
    } catch (error) {
      alert("❌ Error al agregar al carrito")
    } finally {
      setAgregandoCarrito(false)
    }
  }

  const handleToggleFavoriteLocal = () => {
    setEsFavorito(!esFavorito)
    if (onToggleFavorite) onToggleFavorite(producto.id)
  }

  const precioTotal = (Number(producto.precio) * cantidad).toFixed(2)
  const stockColor = producto.stock > 10 ? 'text-green-600' : producto.stock > 0 ? 'text-yellow-600' : 'text-red-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative"
    >
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 bg-green-500 text-white px-4 py-2 z-30 flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          <span className="font-medium">¡Agregado al carrito exitosamente!</span>
        </motion.div>
      )}

      <div className="p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 relative group">
            {producto.imagen ? (
              <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100">
                <Package size={32} className="text-blue-400" />
              </div>
            )}
            <button onClick={handleToggleFavoriteLocal} className="absolute top-1 right-1 bg-white p-1 rounded-full">
              <Heart size={14} className={esFavorito ? "text-red-500 fill-current" : "text-gray-400"} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900 truncate">{producto.nombre}</h3>
              <div className="text-right ml-2">
                <p className="text-2xl font-bold text-blue-600">Bs {Number(producto.precio).toFixed(2)}</p>
                <p className="text-xs text-gray-500">por {producto.unidad || "kg"}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{producto.descripcion}</p>
            <div className="mb-3">
              <span className="text-sm font-medium">Stock: </span>
              <span className={`text-sm font-bold ${stockColor}`}>{producto.stock} disponibles</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button onClick={() => handleCantidadChange(-1)} className="p-2" disabled={cantidad <= 1}><Minus size={16} /></button>
                <span className="px-4 py-2 font-bold text-lg text-center">{cantidad}</span>
                <button onClick={() => handleCantidadChange(1)} className="p-2" disabled={cantidad >= producto.stock}><Plus size={16} /></button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total:</p>
                <p className="font-bold text-lg text-blue-600">Bs {precioTotal}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={() => handleAgregarAlCarrito(true)}
                disabled={agregandoCarrito}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap size={14} /> Quick Buy
              </motion.button>
              <motion.button
                onClick={handleAgregarAlCarrito}
                disabled={agregandoCarrito}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingCart size={14} /> Agregar
              </motion.button>
              <motion.button
                onClick={() => onReservar && onReservar(producto)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar size={14} /> Reservar
              </motion.button>
              <motion.button
                onClick={() => onVerDetalle && onVerDetalle(producto)}
                className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye size={14} /> Detalles
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default TarjetaProductoMultiBotones