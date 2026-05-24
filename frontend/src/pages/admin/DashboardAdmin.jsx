"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Outlet, useLocation } from "react-router-dom"
import { Bell, Fish, Shield } from "lucide-react"
import SidebarAdmin from "../../components/layout/SidebarAdmin"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"

const sectionTitles = {
  "/dashboard-admin":                       "Estadísticas Globales",
  "/dashboard-admin/productos":             "Gestión de Productos",
  "/dashboard-admin/pedidos":               "Gestión de Pedidos",
  "/dashboard-admin/categorias":            "Gestión de Categorías",
  "/dashboard-admin/usuarios":              "Gestión de Usuarios",
  "/dashboard-admin/registrar-productor":   "Registrar Usuario",
}

const DashboardAdmin = () => {
  const location = useLocation()
  const { user } = useAuth()
  const { D } = useTheme()
  const [notiOpen, setNotiOpen] = useState(false)

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "A"
  const nombreCorto = user?.nombre?.split(" ")[0] || "Admin"
  const currentTitle = sectionTitles[location.pathname] || "Admin Panel"

  return (
    <div className="np-orb-bg np-grid" style={{ minHeight: '100vh', background: D.bg, display: 'flex' }}>
      <SidebarAdmin />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <header className="glass" style={{
          borderBottom: `1px solid ${D.border}`,
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 2px 32px rgba(34,197,94,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', gap: 12 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <motion.div whileHover={{ rotate: 15 }} style={{
                background: 'linear-gradient(135deg,#16a34a,#22C55E)',
                padding: '8px', borderRadius: 10,
                boxShadow: '0 0 16px rgba(34,197,94,0.35)',
                flexShrink: 0,
              }}>
                <Fish size={20} color="#fff" />
              </motion.div>
              <h1 style={{
                fontSize: 18, fontWeight: 800, color: D.text,
                letterSpacing: '-0.5px', fontFamily: "'Fira Code', monospace",
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Natura<span style={{ color: D.primary }}>Piscis</span>
              </h1>
            </div>

            {/* Título sección (desktop) */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: D.primary, boxShadow: `0 0 8px ${D.primary}` }} />
              <span style={{ color: D.text, fontWeight: 600, fontSize: 14 }}>{currentTitle}</span>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Badge admin */}
              <div className="hidden sm:flex" style={{
                alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 999,
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
              }}>
                <Shield size={12} style={{ color: D.primary }} />
                <span style={{ color: D.primary, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>ADMIN</span>
              </div>

              {/* Notificaciones */}
              <div style={{ position: 'relative' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setNotiOpen(!notiOpen)}
                  style={{
                    padding: '8px', borderRadius: 10, border: `1px solid ${D.border}`,
                    background: notiOpen ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.05)',
                    cursor: 'pointer', color: D.muted, position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Bell size={18} color={notiOpen ? D.primary : D.muted} />
                </motion.button>

                <AnimatePresence>
                  {notiOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        width: 'min(320px, 92vw)', maxHeight: '70vh',
                        background: 'rgba(10,15,30,0.98)',
                        border: `1px solid ${D.border}`,
                        borderRadius: 14,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.08)',
                        backdropFilter: 'blur(20px)',
                        overflow: 'hidden', zIndex: 100,
                      }}>
                      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${D.border}` }}>
                        <h3 style={{ fontWeight: 700, color: D.text, fontSize: 14, margin: 0 }}>Notificaciones</h3>
                      </div>
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: D.muted, fontSize: 13 }}>
                        No hay notificaciones nuevas
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="hidden md:block" style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: 0 }}>{nombreCorto}</p>
                  <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>Administrador</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#16a34a,#22C55E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    boxShadow: '0 0 12px rgba(34,197,94,0.3)',
                    border: `2px solid rgba(34,197,94,0.3)`,
                    flexShrink: 0,
                  }}
                >
                  {iniciales}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Título móvil debajo (sm) */}
          <div className="md:hidden" style={{ padding: '4px 20px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: D.primary }} />
            <span style={{ color: D.text, fontWeight: 600, fontSize: 13 }}>{currentTitle}</span>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: D.bg, padding: 'clamp(16px, 3vw, 28px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardAdmin
