"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Info } from "lucide-react"

const DetalleProducto = ({ producto, onClose, onAddToCart, onToggleFavorite }) => {
  const [cantidad, setCantidad] = useState(1)
  const [imagenActual, setImagenActual] = useState(0)

  const {
    id,
    nombre,
    imagenes = [],
    precio,
    descripcion,
    categoria,
    disponible,
    calificacion,
    esFavorito,
    caracteristicas = [],
    productor = {},
    stock,
    opiniones = [],
  } = producto

  // Si no hay imágenes múltiples, usar la imagen principal
  const imagenesArray = imagenes.length > 0 ? imagenes : [producto.imagen]

  const handleIncrement = () => {
    if (disponible && cantidad < stock) {
      setCantidad(cantidad + 1)
    }
  }

  const handleDecrement = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1)
    }
  }

  const handleAddToCart = () => {
    onAddToCart(id, cantidad)
  }

  const nextImage = () => {
    setImagenActual((prev) => (prev + 1) % imagenesArray.length)
  }

  const prevImage = () => {
    setImagenActual((prev) => (prev - 1 + imagenesArray.length) % imagenesArray.length)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-md z-10" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Galería de imágenes */}
              <div className="relative h-64 md:h-full bg-blue-50">
                {/* Imagen actual */}
                <img
                  src={imagenesArray[imagenActual] || "/placeholder.svg?height=400&width=400"}
                  alt={nombre}
                  className="w-full h-full object-cover"
                />

                {/* Controles de navegación de imágenes */}
                {imagenesArray.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                      onClick={prevImage}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                      onClick={nextImage}
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Indicadores de imágenes */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                      {imagenesArray.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === imagenActual ? "bg-blue-500" : "bg-white bg-opacity-50"
                          }`}
                          onClick={() => setImagenActual(index)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Badge de categoría */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {categoria}
                </div>
              </div>

              {/* Información del producto */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800">{nombre}</h2>

                  <button
                    onClick={() => onToggleFavorite(id)}
                    className={`p-2 rounded-full ${
                      esFavorito ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Heart size={20} className={esFavorito ? "fill-current" : ""} />
                  </button>
                </div>

                {/* Calificación */}
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(calificacion) ? "text-yellow-500 fill-current" : "text-gray-300"}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {calificacion} ({opiniones.length} opiniones)
                  </span>
                </div>

                {/* Precio y disponibilidad */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">Bs{parseFloat(precio).toFixed(2)}</span>

                    <span className={`text-sm font-medium ${disponible ? "text-green-500" : "text-red-500"}`}>
                      {disponible ? `${stock} unidades disponibles` : "No disponible"}
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                <p className="mt-4 text-gray-600">{descripcion}</p>

                {/* Productor */}
                {productor.nombre && (
                  <div className="mt-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden mr-3">
                      <img
                        src={productor.imagen || "/placeholder.svg?height=40&width=40"}
                        alt={productor.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Productor</p>
                      <p className="font-medium text-gray-800">{productor.nombre}</p>
                    </div>
                  </div>
                )}

                {/* Características */}
                {caracteristicas.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-800 mb-2">Características</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {caracteristicas.map((caracteristica, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Info size={14} className="mr-1 text-blue-500" />
                          {caracteristica}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Controles de cantidad y añadir al carrito */}
                <div className="mt-6 flex items-center">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={handleDecrement}
                      className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                      disabled={cantidad <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium">{cantidad}</span>
                    <button
                      onClick={handleIncrement}
                      className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                      disabled={!disponible || cantidad >= stock}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!disponible}
                    className={`ml-4 flex-grow py-2 px-4 rounded-lg flex items-center justify-center ${
                      disponible
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart size={20} className="mr-2" />
                    Añadir al carrito
                  </button>
                </div>
              </div>
            </div>

            {/* Opiniones */}
            {opiniones.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Opiniones de clientes</h3>
                <div className="space-y-4">
                  {opiniones.slice(0, 3).map((opinion, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < opinion.calificacion ? "text-yellow-500 fill-current" : "text-gray-300"}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-800">{opinion.usuario}</span>
                        <span className="ml-2 text-xs text-gray-500">{opinion.fecha}</span>
                      </div>
                      <p className="text-sm text-gray-600">{opinion.comentario}</p>
                    </div>
                  ))}
                </div>
                {opiniones.length > 3 && (
                  <button className="mt-2 text-blue-600 text-sm font-medium hover:underline">
                    Ver todas las {opiniones.length} opiniones
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default DetalleProducto