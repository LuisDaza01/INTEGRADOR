"use client"
import { motion } from "framer-motion"
import { ShoppingCart, Heart, Info } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const ProductoTienda = ({ producto, onAddToCart, onToggleFavorite, onViewDetails }) => {
  const { D } = useTheme()
  const { id, nombre, imagen, precio, descripcion, categoria, disponible, calificacion, esFavorito } = producto

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      style={{
        background: D.card,
        border: `1px solid ${D.border}`,
        borderRadius: 14,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        transition: 'all 0.3s',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Badge de categoría */}
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          background: `linear-gradient(135deg, ${D.primary}, #16a34a)`,
          color: '#fff', fontSize: 11, fontWeight: 700,
          padding: '4px 10px', borderRadius: 999,
          boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
        }}>
          {categoria}
        </div>

        {/* Badge de disponibilidad */}
        {!disponible && (
          <div style={{
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            background: D.red, color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 999,
            boxShadow: `0 2px 8px ${D.red}60`,
          }}>
            Agotado
          </div>
        )}

        {/* Imagen del producto */}
        <div style={{ height: 192, width: '100%', overflow: 'hidden', background: 'rgba(34,197,94,0.05)' }}>
          <img
            src={typeof imagen === "string" && imagen.startsWith("/images/") ? imagen : `/images/${imagen || "default.jpg"}`}
            alt={nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Nombre y calificación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
          <h3 style={{
            fontSize: 16, fontWeight: 700, color: D.text, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>{nombre}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ color: '#fbbf24' }}>★</span>
            <span style={{ fontSize: 13, color: D.muted }}>{calificacion}</span>
          </div>
        </div>

        {/* Descripción corta */}
        <p style={{
          color: D.muted, fontSize: 13, marginBottom: 12, margin: '0 0 12px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{descripcion}</p>

        {/* Precio y botones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: D.primary }}>Bs {Number(precio).toFixed(2)}</span>

          <div style={{ display: 'flex', gap: 6 }}>
            {/* Botón de favorito */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleFavorite(id)}
              aria-label="Añadir a favoritos"
              style={{
                padding: 6, borderRadius: '50%',
                background: esFavorito ? `${D.red}20` : D.surface,
                color: esFavorito ? D.red : D.muted,
                border: `1px solid ${esFavorito ? D.red + '40' : D.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Heart size={18} fill={esFavorito ? 'currentColor' : 'none'} />
            </motion.button>

            {/* Botón de detalles */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onViewDetails(id)}
              aria-label="Ver detalles"
              style={{
                padding: 6, borderRadius: '50%',
                background: D.surface, color: D.muted,
                border: `1px solid ${D.border}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Info size={18} />
            </motion.button>

            {/* Botón de añadir al carrito */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onAddToCart(id)}
              disabled={!disponible}
              aria-label="Añadir al carrito"
              style={{
                padding: 6, borderRadius: '50%',
                background: disponible ? `linear-gradient(135deg, ${D.primary}, #16a34a)` : D.surface,
                color: disponible ? '#fff' : D.dim || D.muted,
                border: 'none',
                cursor: disponible ? 'pointer' : 'not-allowed',
                opacity: disponible ? 1 : 0.5,
                boxShadow: disponible ? `0 2px 8px ${D.primary}50` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
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
