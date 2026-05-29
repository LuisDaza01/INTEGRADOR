"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  Bell,
  Droplets,
  Fish,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  User,
  ClipboardList,
  Package,
  HelpCircle,
  ChevronLeft,
  Menu,
  MoreHorizontal,
  X,
  Zap,
  CalendarCheck,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

const SidebarProductor = () => {
  const { D } = useTheme()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentTab = location.pathname.split('/dashboard-productor/')[1]?.split('/')[0] || 'inicio'

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "P"
  const nombreCompleto = user?.nombre || "Productor"
  const rol = user?.rol || "productor"
  const [expanded, setExpanded] = useState(true)
  const [screenSize, setScreenSize] = useState('desktop')
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  // Breakpoints alineados con el sidebar del consumidor:
  //  < 900 px   → mobile (drawer + hamburguesa).
  //  900-1279px → tablet/desktop colapsado (icon-only).
  //  ≥ 1280 px  → desktop expandido (label + icon).
  useEffect(() => {
    let raf = null
    const updateScreenSize = () => {
      const w = window.innerWidth
      const mobile = w < 900
      setIsMobile(prev => prev !== mobile ? mobile : prev)
      if (w < 900)       { setScreenSize('mobile');  setExpanded(false) }
      else if (w < 1280) { setScreenSize('tablet');  setExpanded(false) }
      else               { setScreenSize('desktop'); setExpanded(true)  }
      if (!mobile) setIsMobileMenuOpen(false)
    }
    const debounced = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(updateScreenSize) }
    updateScreenSize()
    window.addEventListener("resize", debounced)
    return () => { window.removeEventListener("resize", debounced); if (raf) cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false)
        if (showLogoutModal) setShowLogoutModal(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen, showLogoutModal])

  const handleLogout = () => setShowLogoutModal(true)
  const confirmLogout = () => { logout(); setShowLogoutModal(false) }
  const cancelLogout = () => setShowLogoutModal(false)

  const handleItemClick = (itemId) => {
    const path = itemId === 'dashboard' ? '/dashboard-productor/inicio' : `/dashboard-productor/${itemId}`
    navigate(path)
    if (isMobile) setIsMobileMenuOpen(false)
  }

  const mainMenu = [
    { id: "dashboard",  icon: Home,          text: "Dashboard",    glowColor: "#22C55E" },
    { id: "monitoring", icon: Droplets,       text: "Monitoreo",    glowColor: "#4ade80" },
    { id: "pedidos",    icon: ClipboardList,  text: "Pedidos",      badge: "5", glowColor: "#fb923c" },
    { id: "inventario", icon: Package,        text: "Inventario",   glowColor: "#4ade80" },
    { id: "reservas",   icon: CalendarCheck,  text: "Reservas",     glowColor: "#a78bfa" },
  ]

  const analyticsMenu = [
    { id: "estadisticas",  icon: BarChart3,     text: "Estadísticas",  glowColor: "#c084fc" },
    { id: "mensajes",      icon: MessageSquare, text: "Mensajes",       badge: "3", glowColor: "#818cf8" },
    { id: "notificaciones",icon: Bell,          text: "Notificaciones", badge: "7", glowColor: "#f87171" },
  ]

  const configMenu = [
    { id: "perfil",  icon: User,       text: "Perfil",  glowColor: "#94a3b8" },
    { id: "ajustes", icon: Settings,   text: "Ajustes", glowColor: "#94a3b8" },
    { id: "ayuda",   icon: HelpCircle, text: "Ayuda",   glowColor: "#94a3b8" },
  ]

  const sidebarVariants = {
    expanded:  { width: screenSize === 'large' ? '280px' : '260px', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    collapsed: { width: '72px',  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  }

  const contentVariants = {
    expanded:  { opacity: 1, display: "block", transition: { delay: 0.1, duration: 0.2 } },
    collapsed: { opacity: 0, display: "none",  transition: { duration: 0.15 } },
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{
      background: D.sidebarBg,
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRight: `1px solid ${D.border}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '-40%', width: '90%', height: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '-30%', width: '70%', height: '25%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '-20%', width: '60%', height: '20%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo / Header */}
      <div className="relative flex items-center justify-between px-4 py-5 flex-shrink-0"
        style={{ borderBottom: `1px solid ${D.border}` }}>
        {/* Glow accent */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${D.primary}, ${D.teal}, transparent)` }} />

        {(expanded || isMobile) && (
          <motion.div variants={contentVariants} className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', boxShadow: '0 0 16px rgba(34,197,94,0.5)' }}>
                <Fish size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0f172a]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm tracking-wide truncate" style={{ color: D.text }}>NaturaPiscis</p>
              <p className="text-xs truncate" style={{ color: D.primary }}>Panel Productor</p>
            </div>
          </motion.div>
        )}

        {!expanded && !isMobile && (
          <div className="mx-auto relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', boxShadow: '0 0 16px rgba(34,197,94,0.5)' }}>
              <Fish size={18} className="text-white" />
            </div>
          </div>
        )}

        {/* Mobile close */}
        {isMobile && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ background: D.card }}>
            <X size={18} style={{ color: D.muted }} />
          </motion.button>
        )}

        {/* Desktop toggle */}
        {!isMobile && (
          <button onClick={() => setExpanded(!expanded)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all"
            style={{ background: D.surface, border: `1px solid ${D.border}`, boxShadow: `0 0 12px ${D.shimmer}` }}>
            <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
              <ChevronLeft size={14} className="text-green-400" />
            </motion.div>
          </button>
        )}
      </div>

      {/* Vertical gradient strip on left edge */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, #22C55E, #16a34a, #a78bfa, #22C55E)', opacity: 0.5, pointerEvents: 'none' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto flex flex-col">
        <div className="space-y-1">
          {[...mainMenu, ...analyticsMenu, ...configMenu].map((item) => (
            <SidebarItem key={item.id} {...item}
              isActive={currentTab === item.id}
              onClick={() => handleItemClick(item.id)}
              expanded={expanded || isMobile}
              contentVariants={contentVariants}
              isMobile={isMobile} />
          ))}
        </div>
        <div className="flex-1 min-h-0" />
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', boxShadow: '0 0 12px rgba(34,197,94,0.4)', color: '#fff' }}>
              {iniciales}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: `2px solid ${D.surface}` }} />
          </div>

          {(expanded || isMobile) && (
            <motion.div variants={contentVariants} className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: D.text }}>{nombreCompleto}</p>
              <p className="text-xs capitalize truncate" style={{ color: D.primary }}>{rol}</p>
            </motion.div>
          )}
        </div>

        {/* Logout: ahora se hace desde el dropdown del avatar en el header */}
      </div>
    </div>
  )

  // ── MOBILE — Bottom Navigation Bar ────────────────────────────
  if (isMobile) {
    const bottomNav = [
      mainMenu[0],    // Dashboard
      mainMenu[2],    // Pedidos
      mainMenu[3],    // Inventario
      analyticsMenu[0], // Estadísticas
      configMenu[0],  // Perfil
    ]
    const moreMenuItems = [
      mainMenu[1],    // Monitoreo
      mainMenu[4],    // Reservas (era índice 5 antes de quitar Calendario)
      analyticsMenu[1], // Mensajes
      analyticsMenu[2], // Notificaciones
      configMenu[1],  // Ajustes
      configMenu[2],  // Ayuda
    ]

    return (
      <>
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: D.sidebarBg || 'rgba(6,13,31,0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'stretch',
          height: 62,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
        }}>
          {bottomNav.map(item => {
            const Icon = item.icon
            const itemId = item.id === 'dashboard' ? 'inicio' : item.id
            const active = currentTab === itemId || (item.id === 'dashboard' && currentTab === 'inicio')
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleItemClick(item.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  position: 'relative', padding: '6px 2px',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicatorP"
                    style={{
                      position: 'absolute', top: 0, left: '20%', right: '20%',
                      height: 2, borderRadius: '0 0 3px 3px',
                      background: item.glowColor,
                      boxShadow: `0 0 8px ${item.glowColor}`,
                    }}
                  />
                )}
                <div style={{
                  padding: '5px 10px', borderRadius: 10,
                  background: active ? `${item.glowColor}18` : 'transparent',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={active ? item.glowColor : D.muted} />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: active ? 700 : 500,
                  color: active ? item.glowColor : D.muted,
                  lineHeight: 1, letterSpacing: '0.01em',
                }}>
                  {item.text}
                </span>
              </motion.button>
            )
          })}

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setMoreOpen(true)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 2px',
            }}
          >
            <div style={{ padding: '5px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MoreHorizontal size={20} color={D.muted} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 500, color: D.muted, lineHeight: 1 }}>Más</span>
          </motion.button>
        </nav>

        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMoreOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 55, backdropFilter: 'blur(4px)' }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
                  background: D.surface || 'rgba(14,26,46,0.99)',
                  borderTop: `1px solid ${D.border}`,
                  borderRadius: '20px 20px 0 0',
                  paddingBottom: 'calc(62px + env(safe-area-inset-bottom))',
                  boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: D.border }} />
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px 16px', borderBottom: `1px solid ${D.border}`,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#16a34a,#22C55E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                    boxShadow: '0 0 12px rgba(34,197,94,0.35)', flexShrink: 0,
                  }}>
                    {iniciales}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0 }}>{nombreCompleto}</p>
                    <p style={{ fontSize: 11, color: D.primary, margin: 0, textTransform: 'capitalize' }}>{rol}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 16px 8px' }}>
                  {moreMenuItems.map(item => {
                    const Icon = item.icon
                    const itemId = item.id === 'dashboard' ? 'inicio' : item.id
                    const active = currentTab === itemId
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { handleItemClick(item.id); setMoreOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 14,
                          border: `1px solid ${active ? item.glowColor + '40' : D.border}`,
                          background: active ? `${item.glowColor}12` : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: `${item.glowColor}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={17} color={item.glowColor} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: active ? item.glowColor : D.text, textAlign: 'left' }}>
                          {item.text}
                        </span>
                        {item.badge && (
                          <span style={{
                            marginLeft: 'auto', background: '#ef4444', color: '#fff',
                            fontSize: 9, fontWeight: 700, borderRadius: '50%',
                            width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>{item.badge}</span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Logout: ahora se hace desde el dropdown del avatar en el header */}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <LogoutModal showLogoutModal={showLogoutModal} confirmLogout={confirmLogout} cancelLogout={cancelLogout} />
      </>
    )
  }

  return (
    <motion.aside initial={false} animate={expanded ? "expanded" : "collapsed"} variants={sidebarVariants}
      className="flex flex-col flex-shrink-0"
      style={{
        // Sidebar fijo al viewport — footer queda pegado abajo aunque la página scrollee
        position: 'sticky', top: 0, alignSelf: 'flex-start',
        height: '100vh', maxHeight: '100vh',
        width: expanded ? (screenSize === 'large' ? '280px' : '260px') : '72px',
        minWidth: expanded ? (screenSize === 'large' ? '280px' : '260px') : '72px',
        maxWidth: expanded ? (screenSize === 'large' ? '280px' : '260px') : '72px',
        boxShadow: '4px 0 40px rgba(0,0,0,0.15)',
        borderRight: `1px solid ${D.border}`,
      }}>
      <SidebarContent />
      <LogoutModal showLogoutModal={showLogoutModal} confirmLogout={confirmLogout} cancelLogout={cancelLogout} />
    </motion.aside>
  )
}

const MenuSection = ({ title, items, currentTab, setCurrentTab, expanded, contentVariants, isMobile }) => {
  const { D } = useTheme();
  return (
  <div>
    {(expanded || isMobile) && (
      <motion.h3 variants={contentVariants}
        className="px-2 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${D.border})` }} />
        <span style={{ color: D.muted, letterSpacing: '0.12em' }}>{title}</span>
        <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${D.border}, transparent)` }} />
      </motion.h3>
    )}
    <div className="space-y-1">
      {items.map((item) => (
        <SidebarItem key={item.id} {...item}
          isActive={currentTab === item.id}
          onClick={() => setCurrentTab(item.id)}
          expanded={expanded || isMobile}
          contentVariants={contentVariants}
          isMobile={isMobile} />
      ))}
    </div>
  </div>
  )
}

const SidebarItem = ({ icon: Icon, text, isActive, onClick, badge, glowColor, expanded, contentVariants, isMobile }) => {
  const { D } = useTheme();
  return (
  <div className="relative group">
    <motion.button onClick={onClick}
      whileHover={{ x: expanded ? 3 : 0 }}
      whileTap={{ scale: 0.97 }}
      className={`relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${!expanded ? 'justify-center' : ''}`}
      style={isActive ? {
        background: `linear-gradient(135deg, ${glowColor}22, ${glowColor}0a)`,
        border: `1px solid ${glowColor}40`,
        boxShadow: `0 0 24px ${glowColor}20, inset 0 0 24px ${glowColor}08, 0 2px 8px rgba(0,0,0,0.3)`,
        color: glowColor,
      } : {
        color: D.sub,
        border: '1px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = D.inputBg; e.currentTarget.style.color = D.text; e.currentTarget.style.border = `1px solid ${D.border}` } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.sub; e.currentTarget.style.border = '1px solid transparent' } }}>

      {/* Active left glow bar */}
      {isActive && (
        <motion.div layoutId="activeBar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: glowColor, boxShadow: `0 0 8px ${glowColor}` }} />
      )}

      {/* Cuando colapsado: SOLO icono. Cuando expandido: SOLO texto. */}
      {!expanded && (
        <Icon size={18} className="shrink-0 transition-colors"
          style={{ color: isActive ? glowColor : 'inherit', filter: isActive ? `drop-shadow(0 0 4px ${glowColor})` : 'none' }} />
      )}

      {!expanded && !isMobile && badge && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-white font-bold"
          style={{ fontSize: 9, background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}>
          {badge}
        </span>
      )}

      {expanded && (
        <motion.div variants={contentVariants} className="flex-1 min-w-0 flex items-center justify-between">
          <span className="truncate font-semibold">{text}</span>
          {badge && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-white font-bold flex-shrink-0"
              style={{ fontSize: 9, background: isActive ? glowColor : '#ef4444', boxShadow: isActive ? `0 0 8px ${glowColor}60` : '0 0 6px rgba(239,68,68,0.5)' }}>
              {badge}
            </span>
          )}
        </motion.div>
      )}
    </motion.button>

    {/* Tooltip collapsed */}
    {!expanded && !isMobile && (
      <div className="absolute left-full ml-3 px-3 py-2 rounded-xl text-sm pointer-events-none whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
        style={{ background: D.card, border: `1px solid ${glowColor}35`, color: glowColor, boxShadow: `0 8px 30px rgba(0,0,0,0.3), 0 0 16px ${glowColor}20` }}>
        <span className="font-semibold">{text}</span>
        {badge && <span className="ml-2 text-xs" style={{ color: '#f87171' }}>({badge})</span>}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: `${glowColor}30` }} />
      </div>
    )}
  </div>
  )
}

const LogoutModal = ({ showLogoutModal, confirmLogout, cancelLogout }) => {
  const { D } = useTheme()
  return (
  <AnimatePresence>
    {showLogoutModal && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.7)' }} onClick={cancelLogout}>
        <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }} transition={{ duration: 0.3, ease: "easeOut" }}
          className="np-logout-modal-p rounded-2xl max-w-sm w-full"
          style={{ background: D.card, border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 0 40px rgba(239,68,68,0.15)' }}
          onClick={e => e.stopPropagation()}>
          <style>{`
            .np-logout-modal-p { padding: 24px; }
            .np-logout-modal-p .np-logout-actions-p { display: flex; gap: 12px; }
            @media (max-width: 420px) {
              .np-logout-modal-p { padding: 18px; border-radius: 14px; }
              .np-logout-modal-p .np-logout-actions-p { flex-direction: column-reverse; gap: 8px; }
            }
          `}</style>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
              <LogOut size={24} style={{ color: '#f87171' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: D.text }}>¿Cerrar Sesión?</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: D.muted }}>
              Tendrás que iniciar sesión nuevamente para acceder al panel de productor.
            </p>
            <div className="np-logout-actions-p">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={cancelLogout}
                className="flex-1 text-sm font-semibold rounded-xl transition-colors"
                style={{ background: D.surface, color: D.muted, border: `1px solid ${D.border}`, padding: '12px 16px', minHeight: 44 }}>
                Cancelar
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmLogout}
                className="flex-1 text-sm font-semibold rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', boxShadow: '0 0 16px rgba(220,38,38,0.3)', padding: '12px 16px', minHeight: 44 }}>
                Cerrar Sesión
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  )
}

export default SidebarProductor
