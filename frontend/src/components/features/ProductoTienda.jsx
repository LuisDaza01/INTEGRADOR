"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Heart, Star, Fish } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

// Resuelve la URL de la imagen sin romper con Cloudinary u otras URLs absolutas.
// El bug anterior prefijaba `/images/` a cualquier valor que no empezara con `/images/`,
// rompiendo cualquier URL https.
const resolverImagen = (img) => {
  if (!img || typeof img !== 'string') return null
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('//')) return img
  if (img.startsWith('/')) return img
  return `/images/${img}`
}

const ProductoTienda = ({ producto, onAddToCart, onToggleFavorite, onViewDetails }) => {
  const { D, isDark } = useTheme()
  const [hovered, setHovered] = useState(false)

  const {
    id, nombre, imagen, precio, categoria, unidad,
    disponible = true, stock, calificacion, esFavorito,
    productor_nombre, productor_foto, productor_id,
  } = producto || {}

  const agotado    = !disponible || (stock != null && stock <= 0)
  const esPorKg    = ['kg', 'Kg', 'KG'].includes(unidad)
  const stockBajo  = !agotado && stock != null && stock <= 10
  const imgUrl     = resolverImagen(imagen)
  const rating     = parseFloat(calificacion ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6, boxShadow: '0 18px 48px rgba(34,197,94,0.22)' }}
      style={{
        background: isDark ? 'rgba(13,20,40,0.97)' : D.card,
        border: `1.5px solid ${hovered && !agotado ? D.primary : 'rgba(34,197,94,0.12)'}`,
        borderRadius: 14, overflow: 'hidden',
        opacity: agotado ? 0.78 : 1,
        transition: 'border-color 0.2s',
      }}>

      {/* ── Imagen + badges ── */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'rgba(34,197,94,0.05)' }}>
        {/* shimmer top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 3,
          background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
          opacity: hovered && !agotado ? 1 : 0, transition: 'opacity 0.25s',
        }} />

        {imgUrl ? (
          <img src={imgUrl} alt={nombre}
            onError={e => { e.currentTarget.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.4s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(13,71,40,0.6))',
          }}>
            <Fish size={56} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}

        {/* Badge categoría (top-left) */}
        {categoria && !agotado && (
          <div style={{
            position: 'absolute', top: 8, left: 8, padding: '4px 11px', borderRadius: 999, zIndex: 2,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95))',
            color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
            boxShadow: '0 4px 10px rgba(34,197,94,0.35)',
          }}>{categoria}</div>
        )}

        {/* Rating (top-right) */}
        {rating > 0 && (
          <div style={{
            position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 999, zIndex: 2,
            background: 'rgba(0,0,0,0.55)', color: '#fbbf24', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 3, backdropFilter: 'blur(6px)',
          }}>
            <Star size={10} fill="#fbbf24" />{rating.toFixed(1)}
          </div>
        )}

        {/* Agotado overlay */}
        {agotado && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}>
            <span style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 1,
              background: 'rgba(239,68,68,0.9)', color: '#fff',
            }}>AGOTADO</span>
          </div>
        )}

        {/* Stock bajo (bottom-right) */}
        {stockBajo && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8, padding: '3px 8px', borderRadius: 8, zIndex: 2,
            fontSize: 10, fontWeight: 700, background: 'rgba(251,146,60,0.9)', color: '#fff',
            boxShadow: '0 2px 8px rgba(251,146,60,0.4)',
          }}>⚡ Últimos {stock}</div>
        )}

        {/* Badge por kilo (bottom-left) */}
        {esPorKg && !agotado && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', borderRadius: 8, zIndex: 2,
            fontSize: 10, fontWeight: 700,
            background: 'rgba(251,146,60,0.22)', color: '#fb923c',
            border: '1px solid rgba(251,146,60,0.45)', backdropFilter: 'blur(4px)',
          }}>⚖ por kilo</div>
        )}

        {/* Heart (favorito) — flotante en bottom-right cuando no hay stock-bajo */}
        {onToggleFavorite && !agotado && !stockBajo && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={e => { e.stopPropagation(); onToggleFavorite(id) }}
            aria-label="Añadir a favoritos"
            style={{
              position: 'absolute', bottom: 8, right: 8, zIndex: 2,
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: esFavorito ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.55)',
              color: '#fff', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
            <Heart size={16} fill={esFavorito ? 'currentColor' : 'none'} />
          </motion.button>
        )}
      </div>

      {/* ── Info + CTA ── */}
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{
          fontWeight: 700, fontSize: 14, color: D.text, margin: '0 0 4px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{nombre}</p>

        {/* Mini-chip del productor (si vino en la data) */}
        {productor_nombre && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
            fontSize: 11, color: D.muted, overflow: 'hidden',
          }}>
            {productor_foto ? (
              <img src={productor_foto} alt="" onError={e => { e.currentTarget.style.display = 'none' }}
                style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${D.primary}, #16a34a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 9,
              }}>{productor_nombre[0]?.toUpperCase() || 'P'}</div>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {productor_nombre}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 17, color: agotado ? D.dim : D.primary }}>
              Bs {Number(precio || 0).toFixed(2)}
            </span>
            {unidad && <span style={{ fontSize: 11, color: D.muted, marginLeft: 3 }}>/{unidad}</span>}
          </div>

          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={e => { e.stopPropagation(); !agotado && (onAddToCart?.(id) || onViewDetails?.(id)) }}
            disabled={agotado}
            aria-label={agotado ? 'Producto agotado' : 'Reservar producto'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10,
              border: 'none', flexShrink: 0,
              background: agotado ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #22C55E, #16a34a)',
              boxShadow: agotado ? 'none' : '0 4px 14px rgba(34,197,94,0.4)',
              color: agotado ? D.dim : '#fff', fontWeight: 700, fontSize: 12,
              cursor: agotado ? 'not-allowed' : 'pointer',
            }}>
            <Plus size={14} strokeWidth={2.6} />
            <span>Reservar</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductoTienda
