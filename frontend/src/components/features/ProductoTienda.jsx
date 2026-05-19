"use client"
import { motion } from "framer-motion"
import { ShoppingCart, Heart, Info } from "lucide-react"

const ProductoTienda = ({ producto, onAddToCart, onToggleFavorite, onViewDetails }) => {
  const { id, nombre, imagen, precio, descripcion, categoria, disponible, calificacion, esFavorito } = producto

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <div className="relative">
        {/* Badge de categoría */}
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {categoria}
        </div>

        {/* Badge de disponibilidad */}
        {!disponible && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Agotado
          </div>
        )}

        {/* Imagen del producto */}
        <div className="h-48 w-full overflow-hidden bg-blue-50">
          <img
            src={typeof imagen === "string" && imagen.startsWith("/images/") ? imagen : `/images/${imagen || "default.jpg"}`}

            alt={nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>
      </div>

      <div className="p-4">
        {/* Nombre y calificación */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{nombre}</h3>
          <div className="flex items-center">
            <span className="text-yellow-500">★</span>
            <span className="text-sm text-gray-600 ml-1">{calificacion}</span>
          </div>
        </div>

        {/* Descripción corta */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{descripcion}</p>

        {/* Precio y botones */}
        <div className="flex justify-between items-center mt-4">
        <span className="font-bold text-lg">Bs{Number(precio).toFixed(2)}</span>

          <div className="flex space-x-2">
            {/* Botón de favorito */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleFavorite(id)}
              className={`p-1.5 rounded-full ${esFavorito ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-500"}`}
              aria-label="Añadir a favoritos"
            >
              <Heart size={18} className={esFavorito ? "fill-current" : ""} />
            </motion.button>

            {/* Botón de detalles */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onViewDetails(id)}
              className="p-1.5 rounded-full bg-gray-100 text-gray-500"
              aria-label="Ver detalles"
            >
              <Info size={18} />
            </motion.button>

            {/* Botón de añadir al carrito */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onAddToCart(id)}
              disabled={!disponible}
              className={`p-1.5 rounded-full ${disponible ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              aria-label="Añadir al carrito"
            >
              <ShoppingCart size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductoTienda