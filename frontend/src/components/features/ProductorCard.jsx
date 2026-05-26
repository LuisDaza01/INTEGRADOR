"use client"
import { useState, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { MapPin, Award, Calendar, ChevronRight, Fish, Star, Clock } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

// ── Helpers defensivos ────────────────────────────────────────────────────
const DIA_IDX  = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }
const DIA_NAME = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' }

// dias_venta puede llegar como objeto {lunes:true}, array de strings o array de {dia}
function parseDiasVenta(dv) {
  if (!dv) return []
  if (Array.isArray(dv)) {
    return dv.map(d => typeof d === 'string' ? d.toLowerCase() : (d?.dia || '').toLowerCase()).filter(Boolean)
  }
  if (typeof dv === 'object') {
    return Object.entries(dv).filter(([, v]) => !!v).map(([k]) => k.toLowerCase())
  }
  if (typeof dv === 'string') {
    try { return parseDiasVenta(JSON.parse(dv)) } catch { return [] }
  }
  return []
}

// certificaciones: array | string JSON | undefined
function parseCerts(c) {
  if (!c) return []
  if (Array.isArray(c)) return c
  if (typeof c === 'string') {
    try { const x = JSON.parse(c); return Array.isArray(x) ? x : [c] } catch { return [c] }
  }
  return []
}

// "Vende hoy" / "Próximo: Vie" calculado de dias_venta
function getVentaSiguiente(diasActivos) {
  if (!diasActivos.length) return null
  const today = new Date().getDay()
  const idxs = diasActivos.map(d => DIA_IDX[d]).filter(i => i !== undefined).sort((a, b) => a - b)
  if (!idxs.length) return null
  if (idxs.includes(today)) return { texto: 'Vende hoy', hoy: true }
  const next = idxs.find(i => i > today) ?? idxs[0]
  return { texto: `Próximo: ${DIA_NAME[next]}`, hoy: false }
}

const ProductorCard = ({ productor, onClick }) => {
  const { D, isDark } = useTheme()
  const [hovered, setHovered] = useState(false)

  // ── Datos derivados (defensivos) ──
  const portadaUrl = productor.foto_portada || productor.imagen_portada || null
  const perfilUrl  = productor.foto_perfil   || null
  const diasActivos = useMemo(() => parseDiasVenta(productor.dias_venta), [productor.dias_venta])
  const venta       = useMemo(() => getVentaSiguiente(diasActivos),       [diasActivos])
  const certs       = useMemo(() => parseCerts(productor.certificaciones), [productor.certificaciones])
  const rating      = parseFloat(productor.calificacion_promedio ?? productor.rating ?? 0)
  const numProd     = productor.total_productos ?? productor.productos_count ?? 0
  const precioMin   = parseFloat(productor.precio_minimo ?? productor.precio_min ?? 0)
  const verificado  = !!productor.verificado

  const cardBg = isDark
    ? 'linear-gradient(145deg, rgba(20,40,30,0.45) 0%, rgba(13,20,40,0.65) 50%, rgba(8,14,28,0.75) 100%)'
    : D.surface
  const borderColor = hovered
    ? D.primary
    : isDark ? 'rgba(34,197,94,0.18)' : D.border
  const shadow = isDark
    ? hovered
      ? '0 20px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
    : hovered
      ? '0 12px 40px rgba(34,197,94,0.15)'
      : '0 2px 8px rgba(0,0,0,0.06)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6, scale: 1.015 }}
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
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}>

      {/* Glass highlight (dark) */}
      {isDark && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 40%, transparent 60%)',
        }} />
      )}

      {/* Neon top line on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 5%, #22C55E 50%, transparent 95%)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
      }} />

      {/* Portada */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        {portadaUrl ? (
          <img src={portadaUrl} alt={`Criadero de ${productor.nombre}`}
            onError={e => { e.currentTarget.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(13,71,40,0.85))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Fish size={60} style={{ color: 'rgba(255,255,255,0.35)' }} />
          </div>
        )}
        {/* Gradient overlay for legibility */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,14,28,0.88) 0%, rgba(8,14,28,0.25) 55%, transparent 100%)',
        }} />

        {/* Badge verificado */}
        {verificado && (
          <div style={{
            position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.45)',
            color: '#4ade80', backdropFilter: 'blur(8px)',
          }}>
            <Award size={11} /> Verificado
          </div>
        )}

        {/* Badge calificación */}
        {rating > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10, padding: '4px 10px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)',
            color: '#fbbf24', backdropFilter: 'blur(8px)',
          }}>
            <Star size={11} fill="#fbbf24" />{rating.toFixed(1)}
          </div>
        )}

        {/* Badge vende hoy (esquina inferior-izquierda) */}
        {venta && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10, padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
            background: venta.hoy ? 'rgba(34,197,94,0.25)' : 'rgba(56,189,248,0.18)',
            border: `1px solid ${venta.hoy ? 'rgba(34,197,94,0.5)' : 'rgba(56,189,248,0.4)'}`,
            color: venta.hoy ? '#4ade80' : '#7dd3fc', backdropFilter: 'blur(8px)',
          }}>
            <Clock size={10} />{venta.texto}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={{ padding: 18, position: 'relative', zIndex: 1 }}>
        {/* Header: avatar + nombre + ubicación */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ position: 'relative', marginRight: 10, flexShrink: 0 }}>
            {perfilUrl ? (
              <img src={perfilUrl} alt={productor.nombre}
                onError={e => { e.currentTarget.style.display = 'none' }}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${D.primary}`, boxShadow: `0 0 12px ${D.primary}66` }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `linear-gradient(135deg, ${D.primary}, #16a34a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 16,
                border: `2px solid ${D.primary}`, boxShadow: `0 0 12px ${D.primary}66`,
              }}>{productor.nombre?.[0]?.toUpperCase() || 'P'}</div>
            )}
            <div style={{
              position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%',
              background: '#4ade80', border: `2px solid ${isDark ? 'rgba(8,14,28,0.95)' : D.surface}`,
              boxShadow: '0 0 6px rgba(74,222,128,0.7)',
            }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#fff' : D.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {productor.nombre}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: D.muted }}>
              <MapPin size={11} style={{ color: D.primary }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {productor.ubicacion || productor.ciudad || 'Ubicación no especificada'}
              </span>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <p style={{
          fontSize: 13, color: D.muted, margin: '0 0 12px', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {productor.descripcion_chaco || productor.descripcion || 'Este productor aún no ha añadido una descripción.'}
        </p>

        {/* Certificaciones */}
        {certs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {certs.slice(0, 2).map((c, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: D.primary,
              }}>
                <Award size={10} />{typeof c === 'object' ? c.nombre : c}
              </span>
            ))}
            {certs.length > 2 && (
              <span style={{ fontSize: 11, color: D.primary }}>+{certs.length - 2} más</span>
            )}
          </div>
        )}

        {/* Days strip */}
        {diasActivos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: D.muted, marginBottom: 12 }}>
            <Calendar size={12} style={{ color: D.teal, flexShrink: 0 }} />
            <div style={{ display: 'flex', gap: 3 }}>
              {['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(d => {
                const on = diasActivos.includes(d)
                return (
                  <span key={d} style={{
                    width: 18, height: 18, borderRadius: 4, fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? 'rgba(34,197,94,0.18)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    color: on ? D.primary : D.dim,
                    border: `1px solid ${on ? 'rgba(34,197,94,0.4)' : 'transparent'}`,
                  }}>
                    {d === 'miercoles' ? 'X' : d[0].toUpperCase()}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${D.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: D.muted }}>
              <Fish size={12} style={{ color: D.teal }} />
              <span>{numProd} producto{numProd !== 1 ? 's' : ''}</span>
            </div>
            {precioMin > 0 && (
              <div style={{ fontSize: 12, fontWeight: 700, color: D.primary }}>
                Desde Bs {precioMin.toFixed(0)}
              </div>
            )}
            {productor.vende_cocinado && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', color: '#fb923c' }}>
                Cocinado
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: hovered ? 6 : 4, fontSize: 13, fontWeight: 700, color: D.primary, transition: 'gap 0.2s' }}>
            Ver perfil <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default memo(ProductorCard)
