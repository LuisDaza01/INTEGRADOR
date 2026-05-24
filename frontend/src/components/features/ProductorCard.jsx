"use client"
import { useState, memo } from "react"
import { motion } from "framer-motion"
import { MapPin, Award, Calendar, ChevronRight, Fish, Star } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const ProductorCard = ({ productor, onClick }) => {
  const { D, isDark } = useTheme()
  const [hovered, setHovered] = useState(false)

  const cardBg = isDark
    ? 'linear-gradient(145deg, rgba(30,58,100,0.25) 0%, rgba(13,20,40,0.55) 50%, rgba(8,14,28,0.70) 100%)'
    : D.surface

  const borderColor = hovered
    ? `${D.primary}88`
    : isDark ? 'rgba(56,189,248,0.14)' : D.border

  const shadow = isDark
    ? hovered
      ? '0 16px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(56,189,248,0.12), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
    : hovered
      ? '0 8px 32px rgba(0,0,0,0.12)'
      : '0 2px 8px rgba(0,0,0,0.06)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative',
        background: cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        backdropFilter: isDark ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Glass highlight (dark mode only) */}
      {isDark && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.01) 40%, transparent 60%)',
        }} />
      )}

      {/* Top shimmer on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 5%, ${D.primary}99 40%, ${D.teal}88 60%, transparent 95%)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
      }} />

      {/* Cover image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={productor.imagen_portada || "/placeholder.svg?height=200&width=400"}
          alt={`Criadero de ${productor.nombre}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,14,28,0.88) 0%, rgba(8,14,28,0.25) 55%, transparent 100%)',
        }} />

        {productor.verificado && (
          <div style={{
            position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
            color: '#4ade80', backdropFilter: 'blur(8px)',
          }}>
            <Award size={11} /> Verificado
          </div>
        )}

        {productor.calificacion_promedio > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10, padding: '3px 8px', borderRadius: 20,
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
            color: '#fbbf24', backdropFilter: 'blur(8px)',
          }}>
            <Star size={10} fill="#fbbf24" />
            {Number(productor.calificacion_promedio).toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 18 }}>
        {/* Header row: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ position: 'relative', marginRight: 10, flexShrink: 0 }}>
            <img
              src={productor.foto_perfil || "/placeholder.svg?height=40&width=40"}
              alt={productor.nombre}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${D.primary}88`, boxShadow: `0 0 10px ${D.primary}44` }}
            />
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: '#4ade80', border: `2px solid ${isDark ? 'rgba(8,14,28,0.9)' : D.surface}`, boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#fff' : D.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {productor.nombre}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: D.muted }}>
              <MapPin size={11} style={{ color: D.primary }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {productor.ubicacion || "Ubicación no especificada"}
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: D.muted, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {productor.descripcion_chaco || "Este productor aún no ha añadido una descripción de su criadero."}
        </p>

        {/* Certifications */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {productor.certificaciones && productor.certificaciones.length > 0 ? (
            productor.certificaciones.slice(0, 2).map((cert, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, background: `rgba(56,189,248,0.1)`, border: `1px solid rgba(56,189,248,0.22)`, color: D.primary }}>
                <Award size={10} /> {cert.nombre}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: D.dim }}>Sin certificaciones</span>
          )}
          {productor.certificaciones && productor.certificaciones.length > 2 && (
            <span style={{ fontSize: 11, color: D.primary }}>+{productor.certificaciones.length - 2} más</span>
          )}
        </div>

        {productor.dias_venta && productor.dias_venta.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: D.muted, marginBottom: 10 }}>
            <Calendar size={12} style={{ color: D.teal }} />
            <span>Venta: {productor.dias_venta.slice(0, 2).map(d => d.dia).join(", ")}{productor.dias_venta.length > 2 && "..."}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${D.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: D.muted }}>
              <Fish size={12} style={{ color: D.teal }} />
              <span>{productor.total_productos || 0} productos</span>
            </div>
            {productor.vende_cocinado && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.22)', color: '#fb923c' }}>
                Cocinado
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: hovered ? 6 : 4, fontSize: 13, fontWeight: 600, color: D.primary, transition: 'gap 0.2s' }}>
            Ver perfil <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// memo evita re-renders de toda la lista cuando solo cambia el filtro
export default memo(ProductorCard)
