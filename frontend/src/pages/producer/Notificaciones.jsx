"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Settings, Trash2, RefreshCw, ChevronRight } from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const Notificaciones = () => {
  const { D } = useTheme()
  const [activeFilter, setActiveFilter] = useState("all")
  const [showSettings, setShowSettings] = useState(false)

  const typeStyle = {
    alerta:  { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)'  },
    info:    { bg: 'rgba(56,189,248,0.1)',   color: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
    success: { bg: 'rgba(74,222,128,0.1)',   color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  }

  const notificacionesEjemplo = [
    { id: 1, tipo: "alerta",  titulo: "Nivel de oxígeno bajo",     mensaje: "El estanque #3 ha registrado niveles de oxígeno por debajo del umbral recomendado.", tiempo: "10 minutos", leido: false, icono: AlertTriangle },
    { id: 2, tipo: "info",    titulo: "Nuevo pedido recibido",      mensaje: "Has recibido un nuevo pedido de Restaurante El Pescador por 15kg de tilapia.",         tiempo: "30 minutos", leido: false, icono: Info },
    { id: 3, tipo: "success", titulo: "Envío completado",           mensaje: "El pedido #1234 ha sido entregado exitosamente al cliente.",                            tiempo: "2 horas",    leido: true,  icono: CheckCircle },
    { id: 4, tipo: "alerta",  titulo: "Temperatura elevada",        mensaje: "El estanque #1 ha registrado un aumento de temperatura por encima del rango óptimo.",   tiempo: "3 horas",    leido: true,  icono: AlertTriangle },
    { id: 5, tipo: "info",    titulo: "Mantenimiento programado",   mensaje: "Se ha programado un mantenimiento para el sistema de filtración el día 15/11/2023.",    tiempo: "5 horas",    leido: true,  icono: Clock },
    { id: 6, tipo: "success", titulo: "Actualización completada",   mensaje: "La actualización del sistema de monitoreo se ha completado correctamente.",             tiempo: "1 día",      leido: true,  icono: CheckCircle },
    { id: 7, tipo: "info",    titulo: "Nuevo cliente registrado",   mensaje: "Supermercados del Norte se ha registrado como nuevo cliente en la plataforma.",          tiempo: "1 día",      leido: true,  icono: Info },
  ]

  const filteredNotifications = notificacionesEjemplo.filter(n => {
    if (activeFilter === "all")    return true
    if (activeFilter === "unread") return !n.leido
    return n.tipo === activeFilter
  })

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } }

  const filters = [
    { id: "all", label: "Todas" }, { id: "unread", label: "No leídas" },
    { id: "alerta", label: "Alertas" }, { id: "info", label: "Información" }, { id: "success", label: "Éxitos" },
  ]

  const iconBtnSt = { padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: D.muted, display: 'flex', alignItems: 'center' }

  return (
    <motion.div style={{ padding: 24, height: '100%', overflowY: 'auto', background: D.bg }}
      initial="hidden" animate="visible" variants={containerVariants}>

      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Notificaciones</h1>
          <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Mantente al día con alertas y actualizaciones importantes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ icon: Settings, action: () => setShowSettings(!showSettings) }, { icon: RefreshCw, action: () => {} }].map(({ icon: Icon, action }, i) => (
            <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={action}
              style={{ padding: '8px 10px', background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Icon size={16} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Filter chips */}
      <motion.div variants={itemVariants} style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 16, paddingBottom: 4 }}>
        {filters.map(f => (
          <motion.button key={f.id} onClick={() => setActiveFilter(f.id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600,
              background: activeFilter === f.id ? `rgba(56,189,248,0.15)` : D.card,
              color: activeFilter === f.id ? D.primary : D.muted,
              outline: activeFilter === f.id ? `1.5px solid ${D.primary}` : `1px solid ${D.border}` }}>
            {f.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Settings panel */}
      {showSettings && (
        <motion.div variants={itemVariants} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, color: D.text, marginBottom: 16, fontSize: 15 }}>Configuración de notificaciones</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {[
              { id: "email", label: "Notificaciones por email", default: true },
              { id: "push", label: "Notificaciones push", default: true },
              { id: "alerts", label: "Alertas de sensores", default: true },
              { id: "orders", label: "Nuevos pedidos", default: true },
              { id: "system", label: "Actualizaciones del sistema", default: false },
              { id: "marketing", label: "Información de marketing", default: false },
            ].map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={opt.default}
                  style={{ accentColor: D.primary, width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: D.text }}>{opt.label}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowSettings(false)}
              style={{ padding: '8px 18px', borderRadius: 8, background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Guardar preferencias
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Notifications list */}
      <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Bell size={48} style={{ color: D.dim, margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>No hay notificaciones</h3>
            <p style={{ color: D.muted }}>No tienes notificaciones que coincidan con este filtro</p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const ts = typeStyle[notif.tipo] || typeStyle.info
            const Icon = notif.icono
            return (
              <motion.div key={notif.id} variants={itemVariants} whileHover={{ y: -2 }}
                style={{ background: D.card, border: `1px solid ${notif.leido ? D.border : ts.border}`, borderRadius: 12, padding: 16,
                  borderLeftWidth: !notif.leido ? 3 : 1, borderLeftColor: !notif.leido ? ts.color : D.border }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ padding: 8, borderRadius: '50%', background: ts.bg, flexShrink: 0 }}>
                    <Icon size={18} style={{ color: ts.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <h3 style={{ fontWeight: notif.leido ? 500 : 700, color: D.text, margin: '0 0 4px', fontSize: 14 }}>{notif.titulo}</h3>
                        <p style={{ color: D.muted, fontSize: 13, margin: 0 }}>{notif.mensaje}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: D.muted, whiteSpace: 'nowrap' }}>Hace {notif.tiempo}</span>
                        <motion.button style={iconBtnSt} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><CheckCircle size={15} /></motion.button>
                        <motion.button style={{ ...iconBtnSt, color: D.red }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Trash2 size={15} /></motion.button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} style={{ color: D.muted }} />
                        <span style={{ fontSize: 12, color: D.muted }}>{notif.tiempo}</span>
                      </div>
                      <motion.button whileHover={{ x: 2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: D.primary, fontSize: 12, fontWeight: 600 }}>
                        Ver detalles <ChevronRight size={13} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </motion.div>
  )
}

export default Notificaciones
