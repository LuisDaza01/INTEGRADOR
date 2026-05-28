"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Settings, Save, Bell, Lock, User, Globe, Database,
  Monitor, CreditCard, Smartphone, Moon, Sun, ChevronRight, Check,
} from "lucide-react"
import { useTheme } from "../../contexts/ThemeContext"

const Ajustes = () => {
  const { D, isDark, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState("general")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [language, setLanguage] = useState("es")
  const [currency, setCurrency] = useState("BOB")

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  const sections = [
    { id: "general",       label: "General",              icon: Settings   },
    { id: "account",       label: "Cuenta",               icon: User       },
    { id: "notifications", label: "Notificaciones",       icon: Bell       },
    { id: "security",      label: "Seguridad",            icon: Lock       },
    { id: "appearance",    label: "Apariencia",           icon: Monitor    },
    { id: "language",      label: "Idioma y región",      icon: Globe      },
    { id: "billing",       label: "Facturación",          icon: CreditCard },
    { id: "data",          label: "Datos y almacenamiento", icon: Database },
    { id: "mobile",        label: "Aplicación móvil",     icon: Smartphone },
  ]

  const cardSt = { background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }
  const selectSt = { background: D.surface, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', colorScheme: isDark ? 'dark' : 'light' }
  const rowSt = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${D.border}` }
  const lastRowSt = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }

  const Toggle = ({ enabled, onChange }) => (
    <div style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}
      onClick={() => onChange(!enabled)}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: enabled ? D.primary : D.dim, transition: 'background 0.2s' }} />
      <div style={{ position: 'absolute', top: 2, left: enabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  )

  const ToggleRow = ({ label, enabled, onChange, last }) => (
    <div style={last ? lastRowSt : rowSt}>
      <span style={{ color: D.text, fontSize: 14 }}>{label}</span>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div>
            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Preferencias generales</h3>
              <ToggleRow label="Guardar cambios automáticamente" enabled={autoSave} onChange={setAutoSave} />
              <div style={rowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Zona horaria</span>
                <select style={selectSt}>
                  <option>América/Ciudad de México (GMT-6)</option>
                  <option>América/Bogotá (GMT-5)</option>
                  <option>América/Santiago (GMT-4)</option>
                  <option>Europa/Madrid (GMT+1)</option>
                </select>
              </div>
              <div style={lastRowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Formato de fecha</span>
                <select style={selectSt}>
                  <option>DD/MM/AAAA</option>
                  <option>MM/DD/AAAA</option>
                  <option>AAAA-MM-DD</option>
                </select>
              </div>
            </div>

            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Unidades de medida</h3>
              <div style={rowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Sistema de unidades</span>
                <select style={selectSt}>
                  <option>Métrico (kg, cm, °C)</option>
                  <option>Imperial (lb, in, °F)</option>
                </select>
              </div>
              <div style={lastRowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Formato de volumen</span>
                <select style={selectSt}>
                  <option>Litros (L)</option>
                  <option>Metros cúbicos (m³)</option>
                  <option>Galones (gal)</option>
                </select>
              </div>
            </div>
          </div>
        )

      case "appearance":
        return (
          <div>
            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Tema y apariencia</h3>
              <div style={rowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Modo oscuro</span>
                <motion.button onClick={toggleTheme} whileTap={{ scale: 0.95 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#fbbf24' : D.primary }}>
                  {isDark ? <Moon size={22} /> : <Sun size={22} />}
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{isDark ? 'Oscuro' : 'Claro'}</span>
                </motion.button>
              </div>
              <div style={rowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Densidad de contenido</span>
                <select style={selectSt}><option>Compacta</option><option>Normal</option><option>Espaciada</option></select>
              </div>
              <div style={lastRowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Tamaño de fuente</span>
                <select style={selectSt}><option>Pequeño</option><option>Mediano</option><option>Grande</option></select>
              </div>
            </div>

            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Personalización</h3>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 10 }}>Color principal</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"].map((color) => (
                    <motion.button key={color} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: color, border: color === "#3B82F6" ? `3px solid ${D.text}` : `2px solid transparent`, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 10 }}>Diseño del dashboard</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {["Clásico", "Moderno", "Compacto"].map((layout, index) => (
                    <motion.div key={layout} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                      style={{ border: `1.5px solid ${index === 1 ? D.primary : D.border}`, borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer', background: index === 1 ? `rgba(34,197,94,0.08)` : D.surface }}>
                      <div style={{ height: 40, background: D.dim, borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {index === 1 && <Check size={14} style={{ color: D.primary }} />}
                      </div>
                      <span style={{ fontSize: 13, color: D.text }}>{layout}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "language":
        return (
          <div>
            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Idioma y localización</h3>
              <div style={rowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Idioma de la plataforma</span>
                <select style={selectSt} value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="es">Español</option><option value="en">English</option>
                  <option value="pt">Português</option><option value="fr">Français</option>
                </select>
              </div>
              <div style={rowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Moneda</span>
                <select style={selectSt} value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="BOB">Boliviano (BOB)</option><option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option><option value="COP">Peso COP</option>
                </select>
              </div>
              <div style={lastRowSt}>
                <span style={{ color: D.text, fontSize: 14 }}>Formato numérico</span>
                <select style={selectSt}><option>1,234.56</option><option>1.234,56</option></select>
              </div>
            </div>
            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Traducción</h3>
              <ToggleRow label="Traducir automáticamente mensajes" enabled={true} onChange={() => {}} />
              <ToggleRow label="Mostrar nombres en múltiples idiomas" enabled={false} onChange={() => {}} last />
            </div>
          </div>
        )

      case "notifications":
        return (
          <div>
            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Preferencias de notificaciones</h3>
              <ToggleRow label="Activar notificaciones" enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
              <ToggleRow label="Notificaciones por email" enabled={true} onChange={() => {}} />
              <ToggleRow label="Notificaciones push" enabled={true} onChange={() => {}} />
              <ToggleRow label="Notificaciones SMS" enabled={false} onChange={() => {}} last />
            </div>
            <div style={cardSt}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: '0 0 16px' }}>Tipos de alertas</h3>
              <ToggleRow label="Alertas de sensores" enabled={true} onChange={() => {}} />
              <ToggleRow label="Nuevos pedidos" enabled={true} onChange={() => {}} />
              <ToggleRow label="Actualizaciones del sistema" enabled={true} onChange={() => {}} />
              <ToggleRow label="Noticias y marketing" enabled={false} onChange={() => {}} last />
            </div>
          </div>
        )

      default:
        return (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Settings size={48} style={{ color: D.dim, margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: D.text, marginBottom: 8 }}>Configuración en desarrollo</h3>
            <p style={{ color: D.muted }}>Esta sección está actualmente en desarrollo</p>
          </div>
        )
    }
  }

  return (
    <motion.div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: D.bg }}
      initial="hidden" animate="visible" variants={containerVariants}>

      {/* Layout: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Settings sidebar */}
        <motion.div variants={itemVariants}
          style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${D.border}`, background: D.surface, overflowY: 'auto' }}>
          <div style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: '0 0 4px' }}>Ajustes</h2>
            <p style={{ fontSize: 13, color: D.muted, marginBottom: 16 }}>Configura tu cuenta y preferencias</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map(section => (
                <motion.button key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10,
                    background: activeSection === section.id ? `rgba(34,197,94,0.12)` : 'transparent',
                    color: activeSection === section.id ? D.primary : D.muted,
                    fontWeight: activeSection === section.id ? 700 : 500, fontSize: 13,
                  }}>
                  <section.icon size={16} />
                  <span style={{ flex: 1 }}>{section.label}</span>
                  <ChevronRight size={14} />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div variants={itemVariants} style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {renderContent()}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                background: `linear-gradient(135deg,${D.primary},${D.teal})`, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
              <Save size={16} />
              Guardar cambios
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Ajustes
