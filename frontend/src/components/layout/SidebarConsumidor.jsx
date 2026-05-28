"use client"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, Store, CalendarPlus, Package, User,
  HelpCircle, LogOut, ChevronRight, Menu, X, CalendarDays, MessageCircle, Microscope,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"

const menuItems = [
  { id: "inicio",      label: "Inicio",      icon: Home,         color: '#22C55E', path: "/dashboard-consumidor" },
  { id: "tienda",      label: "Tienda",      icon: Store,        color: '#4ade80', path: "/dashboard-consumidor/tienda" },
  { id: "carrito",     label: "Reservar",    icon: CalendarPlus, color: '#fb923c', path: "/dashboard-consumidor/carrito", badge: null },
  { id: "mis-pedidos",  label: "Mis Pedidos",  icon: Package,      color: '#a78bfa', path: "/dashboard-consumidor/mis-pedidos"  },
  { id: "mis-reservas", label: "Mis Reservas", icon: CalendarDays,    color: '#4ade80', path: "/dashboard-consumidor/mis-reservas" },
  { id: "mensajes",     label: "Mensajes",     icon: MessageCircle,   color: '#22C55E', path: "/dashboard-consumidor/mensajes"    },
  { id: "perfil",       label: "Mi Perfil",    icon: User,            color: '#4ade80', path: "/dashboard-consumidor/perfil"      },
  { id: "analizar-frescura", label: "Analizar Frescura", icon: Microscope, color: '#86efac', path: "/dashboard-consumidor/analizar-frescura" },
  { id: "ayuda",       label: "Ayuda",       icon: HelpCircle,   color: '#64748b', path: "/dashboard-consumidor/ayuda" },
]

const SidebarConsumidor = () => {
  const { logout, user } = useAuth()
  const { D } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "U"
  const nombreCompleto = user?.nombre || "Usuario"

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Breakpoints responsive:
  //  < 900 px   → mobile: drawer con hamburguesa (incluye tablets en vertical y celulares en horizontal).
  //  900-1279px → desktop con sidebar colapsada (solo iconos, 72px).
  //  ≥ 1280 px  → desktop con sidebar expandida (260px + labels).
  useEffect(() => {
    let raf = null
    const check = () => {
      const w = window.innerWidth
      const mobile = w < 900
      setIsMobile(prev => prev !== mobile ? mobile : prev)
      if (!mobile) setIsMobileMenuOpen(false)
      if (w >= 900 && w < 1280) setIsCollapsed(true)
      else if (w >= 1280) setIsCollapsed(false)
    }
    const debounced = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('resize', debounced)
    return () => { window.removeEventListener('resize', debounced); if (raf) cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    const esc = e => { if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false) }
    if (isMobileMenuOpen) { document.addEventListener('keydown', esc); document.body.style.overflow = 'hidden' }
    else document.body.style.overflow = 'unset'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  const getCurrentTab = () => {
    const p = location.pathname
    if (p === '/dashboard-consumidor') return 'inicio'
    if (p.split('/').includes('productor') || p.includes('tienda') || p.includes('productores')) return 'tienda'
    if (p.includes('mis-reservas')) return 'mis-reservas'
    return p.split('/').pop()
  }
  const currentTab = getCurrentTab()

  const handleItemClick = item => {
    navigate(item.path)
    if (isMobile) setIsMobileMenuOpen(false)
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
      {/* Mobile header */}
      {isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px', borderBottom: `1px solid ${D.border}`,
          background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(74,222,128,0.08))',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, color: D.text, fontSize: 16 }}>NaturaPiscis</h2>
              <p style={{ fontSize: 11, color: D.muted }}>Panel Consumidor</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: 'rgba(34,197,94,0.1)', border: `1px solid ${D.border}`, borderRadius: 8, padding: '6px', cursor: 'pointer', color: D.muted }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(item => {
            const Icon = item.icon
            const active = currentTab === item.id
            return (
              <li key={item.id}>
                <motion.button
                  whileHover={{ x: isCollapsed && !isMobile ? 0 : 3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleItemClick(item)}
                  title={isCollapsed && !isMobile ? item.label : ""}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: isCollapsed && !isMobile ? 0 : 12,
                    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                    padding: isCollapsed && !isMobile ? '12px 0' : '11px 14px',
                    borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: active ? `rgba(34,197,94,0.1)` : 'transparent',
                    borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
                    boxShadow: active ? `inset 0 0 12px rgba(34,197,94,0.06)` : 'none',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = D.inputBg || 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon size={21} color={active ? item.color : D.muted} style={{ flexShrink: 0 }} />
                  <AnimatePresence initial={false}>
                    {(!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          fontWeight: active ? 700 : 500, fontSize: 14,
                          color: active ? item.color : D.muted,
                          overflow: 'hidden', whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {item.badge && (!isCollapsed || isMobile) && (
                    <span style={{
                      marginLeft: 'auto', background: '#ef4444', color: '#fff',
                      fontSize: 10, fontWeight: 700, borderRadius: '50%',
                      width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && !isMobile && (
                    <div style={{
                      position: 'absolute', left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)',
                      background: '#1e293b', color: D.text, fontSize: 12, fontWeight: 600,
                      borderRadius: 8, padding: '6px 10px',
                      border: `1px solid ${D.border}`,
                      whiteSpace: 'nowrap', pointerEvents: 'none',
                      opacity: 0, transition: 'opacity 0.15s', zIndex: 50,
                    }}
                      className="sidebar-tooltip">
                      {item.label}
                    </div>
                  )}
                </motion.button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      {(!isCollapsed || isMobile) && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            padding: '14px', borderTop: `1px solid ${D.border}`,
            background: 'rgba(34,197,94,0.03)', flexShrink: 0,
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#16a34a,#22C55E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 10px rgba(34,197,94,0.25)',
            }}>
              {iniciales}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nombreCompleto}
              </p>
              <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>Consumidor</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: `1px solid ${D.border}`, flexShrink: 0 }}>
        <motion.button
          whileHover={{ x: isCollapsed && !isMobile ? 0 : 3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLogoutModal(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: isCollapsed && !isMobile ? 0 : 10,
            justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
            padding: '10px 14px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: D.red,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {(!isCollapsed || isMobile) && (
            <span style={{ fontWeight: 600, fontSize: 14 }}>Cerrar Sesión</span>
          )}
        </motion.button>
      </div>
    </div>
  )

  const LogoutModal = () => (
    <AnimatePresence>
      {showLogoutModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="np-logout-modal"
            style={{
              background: 'rgba(10,15,30,0.98)',
              border: `1px solid rgba(248,113,113,0.3)`,
              borderRadius: 18, maxWidth: 360, width: '100%',
              boxShadow: '0 0 40px rgba(248,113,113,0.15)',
            }}
          >
            <style>{`
              .np-logout-modal { padding: 28px; }
              .np-logout-modal .np-logout-actions { display: flex; gap: 12px; }
              @media (max-width: 420px) {
                .np-logout-modal { padding: 20px; border-radius: 16px; }
                .np-logout-modal .np-logout-actions { flex-direction: column-reverse; gap: 8px; }
              }
            `}</style>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'rgba(248,113,113,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                border: `1px solid rgba(248,113,113,0.3)`,
              }}>
                <LogOut size={24} color={D.red} />
              </div>
              <h3 style={{ fontWeight: 700, color: D.text, fontSize: 18, margin: '0 0 8px' }}>¿Cerrar Sesión?</h3>
              <p style={{ color: D.muted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.5 }}>
                ¿Estás seguro? Tendrás que iniciar sesión nuevamente.
              </p>
              <div className="np-logout-actions">
                <button onClick={() => setShowLogoutModal(false)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${D.border}`,
                  background: 'rgba(34,197,94,0.06)', color: D.text, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  minHeight: 44,
                }}>
                  Cancelar
                </button>
                <button onClick={() => { logout(); setShowLogoutModal(false) }} style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  minHeight: 44,
                }}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── MOBILE ─────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(true)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 50,
            background: 'rgba(10,15,30,0.95)',
            border: `1px solid ${D.border}`,
            borderRadius: 12, padding: '10px', cursor: 'pointer',
            color: D.primary,
            boxShadow: '0 0 16px rgba(34,197,94,0.2)',
          }}
        >
          <Menu size={22} />
        </motion.button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0,
                width: 'min(300px, 86vw)', maxWidth: 320,
                background: D.surface,
                border: `1px solid ${D.border}`,
                borderLeft: 'none',
                boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
                zIndex: 50, display: 'flex', flexDirection: 'column',
              }}
            >
              <SidebarContent />
            </motion.div>
          )}
        </AnimatePresence>

        <LogoutModal />
      </>
    )
  }

  // ── DESKTOP ────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          background: D.sidebarBg,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: `1px solid ${D.border}`,
          height: '100%', minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          position: 'relative', flexShrink: 0,
          boxShadow: '2px 0 32px rgba(0,0,0,0.2)',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute', right: -14, top: 32, zIndex: 10,
            background: D.surface,
            border: `1px solid ${D.border}`,
            borderRadius: '50%', padding: '6px', cursor: 'pointer',
            color: D.primary,
            boxShadow: '0 0 12px rgba(34,197,94,0.2)',
          }}
        >
          <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={15} />
          </motion.div>
        </motion.button>

        <SidebarContent />
      </motion.div>

      <LogoutModal />

      <style>{`
        .sidebar-tooltip { opacity: 0 !important }
        button:hover .sidebar-tooltip { opacity: 1 !important }
      `}</style>
    </>
  )
}

export default SidebarConsumidor
