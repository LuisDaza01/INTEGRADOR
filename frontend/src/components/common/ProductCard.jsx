"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  Edit, Trash2, Eye, ShoppingBag, AlertTriangle, BarChart2,
  Tag, Clock, ChevronDown, ChevronUp,
} from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const ProductCard = ({ producto, onEdit, onDelete, onView }) => {
  const { D } = useTheme()
  const [expanded, setExpanded] = useState(false)

  const getStatusStyle = (estado) => {
    switch (estado) {
      case "Disponible":   return { background: 'rgba(74,222,128,0.15)',  color: '#4ade80' }
      case "Bajo stock":   return { background: 'rgba(234,179,8,0.15)',   color: '#facc15' }
      case "Agotado":      return { background: 'rgba(248,113,113,0.15)', color: '#f87171' }
      case "Próximamente": return { background: 'rgba(34,197,94,0.15)',  color: '#22C55E' }
      default:             return { background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
    }
  }

  const stockPercentage = producto.stock > 0 ? Math.min((producto.stock / producto.stockMaximo) * 100, 100) : 0
  const statusSt = getStatusStyle(producto.estado)
  const stockColor = stockPercentage > 60 ? '#4ade80' : stockPercentage > 25 ? '#facc15' : '#f87171'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative' }}>
        <img src={producto.imagen || "/placeholder.svg"} alt={producto.nombre}
          style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          {[
            { Icon: Eye,    action: () => onView?.(producto) },
            { Icon: Edit,   action: () => onEdit?.(producto) },
            { Icon: Trash2, action: () => onDelete?.(producto) },
          ].map(({ Icon, action }, i) => (
            <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={action}
              style={{ padding: 6, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Icon size={14} style={{ color: '#fff' }} />
            </motion.button>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)', padding: '12px 12px 10px' }}>
          <span style={{ ...statusSt, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            {producto.estado}
          </span>
        </div>
      </div>

      {/* Info principal */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {producto.nombre}
          </h3>
          <span style={{ fontSize: 15, fontWeight: 800, color: D.text, flexShrink: 0 }}>
            Bs{Number(producto.precio).toFixed(2)}/kg
          </span>
        </div>

        <p style={{ marginTop: 4, fontSize: 13, color: D.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {producto.descripcion}
        </p>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', fontSize: 12, color: D.muted, gap: 4, flexWrap: 'wrap' }}>
          <Tag size={12} />
          <span>{producto.categoria}</span>
          <span style={{ margin: '0 2px' }}>•</span>
          <Clock size={12} />
          <span>Actualizado: {producto.ultimaActualizacion}</span>
        </div>

        {/* Barra de stock */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: D.text }}>Stock disponible</span>
            <span style={{ color: producto.stock === 0 ? '#f87171' : D.muted }}>
              {producto.stock} / {producto.stockMaximo} kg
            </span>
          </div>
          <div style={{ height: 6, background: D.border, borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stockPercentage}%` }}
              transition={{ duration: 1 }}
              style={{ height: '100%', background: stockColor, borderRadius: 3 }}
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { Icon: ShoppingBag, label: 'Ventas',   value: `${producto.ventas} kg` },
            { Icon: BarChart2,   label: 'Ingresos', value: `Bs${Number(producto.ingresos).toFixed(2)}` },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ background: D.surface, padding: 8, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <Icon size={13} style={{ color: D.primary }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: D.muted }}>{label}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Botón expandir */}
        <button onClick={() => setExpanded(!expanded)}
          style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, color: D.primary, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Menos detalles' : 'Más detalles'}
        </button>
      </div>

      {/* Sección expandible */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden', background: D.surface, borderTop: `1px solid ${D.border}` }}
      >
        <div style={{ padding: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 8 }}>Detalles del producto</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
            {[
              { label: 'Tipo',    value: producto.tipo },
              { label: 'Origen',  value: producto.origen },
              { label: 'Tamaño',  value: producto.tamano },
              { label: 'Cosecha', value: producto.fechaCosecha },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: D.muted }}>{label}:</span>
                <span style={{ fontWeight: 600, color: D.text }}>{value}</span>
              </div>
            ))}
          </div>

          {producto.stock < producto.stockMinimo && (
            <div style={{ marginTop: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={14} style={{ color: '#facc15', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#facc15', margin: 0 }}>
                El stock está por debajo del mínimo recomendado ({producto.stockMinimo} kg).
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProductCard
