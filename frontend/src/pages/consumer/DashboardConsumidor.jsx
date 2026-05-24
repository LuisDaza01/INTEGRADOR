"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Search, Fish, X, Sun, Moon, CheckCheck } from "lucide-react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import SidebarConsumidor from "../../components/layout/SidebarConsumidor"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNotificaciones, useMarcarLeidaMutation, useMarcarTodasLeidasMutation } from "../../hooks/queries"
import GlitchText from "../../components/effects/GlitchText"

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')

const DashboardConsumidor = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { D, isDark, toggleTheme } = useTheme()
  const queryClient = useQueryClient()
  const socketRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const { data: notifData } = useNotificaciones()
  const marcarLeida        = useMarcarLeidaMutation()
  const marcarTodas        = useMarcarTodasLeidasMutation()

  const notifications = notifData?.notificaciones ?? []
  const unread        = notifData?.noLeidas ?? 0

  useEffect(() => {
    if (!localStorage.getItem('usuario')) return
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    })
    socket.on('nueva_notificacion', () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
    })
    socketRef.current = socket
    return () => { socket.disconnect(); socketRef.current = null }
  }, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/dashboard-consumidor/productores?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const handleMarcarLeida = (id) => {
    marcarLeida.mutate(id)
  }

  const handleMarcarTodas = () => {
    marcarTodas.mutate()
  }

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)   return 'Ahora'
    if (mins < 60)  return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)   return `Hace ${hrs} h`
    return `Hace ${Math.floor(hrs / 24)} día${Math.floor(hrs / 24) !== 1 ? 's' : ''}`
  }

  const currentPath = location.pathname.split('/').pop()
  const currentTab = currentPath === 'dashboard-consumidor' ? 'inicio' : currentPath

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "U"
  const nombreCorto = user?.nombre?.split(" ")[0] || "Usuario"

  return (
    <div className="np-orb-bg np-grid" style={{ minHeight: '100vh', background: D.bg, display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="glass" style={{
        borderBottom: `1px solid ${D.border}`,
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: isDark ? '0 2px 32px rgba(34,197,94,0.08)' : '0 2px 20px rgba(22,163,74,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div whileHover={{ rotate: 15 }} style={{
              background: 'linear-gradient(135deg,#16a34a,#22C55E)',
              padding: '8px', borderRadius: 10,
              boxShadow: '0 0 16px rgba(34,197,94,0.35)',
            }}>
              <Fish size={22} color="#fff" />
            </motion.div>
            <GlitchText as="h1" style={{ fontSize: 20, fontWeight: 800, color: D.text, letterSpacing: '-0.5px' }} continuous>
              NaturaPiscis
            </GlitchText>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: 420, margin: '0 24px', display: 'none' }}
            className="hidden md:block">
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: D.primary, pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Buscar productos, productores..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                style={{
                  width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                  background: isDark ? 'rgba(34,197,94,0.05)' : D.surface,
                  border: `1px solid ${D.border}`,
                  borderRadius: 10, color: D.text, fontSize: 13, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = D.primary}
                onBlur={e => e.target.style.borderColor = D.border}
              />
            </div>
          </div>

          {/* Hidden on mobile — show on md+ */}
          <style>{`.search-md { display: none } @media (min-width: 768px) { .search-md { display: block } }`}</style>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search on mobile */}
            <div className="md:hidden search-md" style={{ flex: 1, maxWidth: 300, marginRight: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: D.primary, pointerEvents: 'none' }} />
                <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: isDark ? 'rgba(34,197,94,0.05)' : D.surface, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 12, outline: 'none' }} />
              </div>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
              style={{
                padding: '8px', borderRadius: 10, border: `1px solid ${D.border}`,
                background: 'rgba(34,197,94,0.05)',
                cursor: 'pointer', color: D.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isDark
                ? <Sun size={18} color="#fbbf24" />
                : <Moon size={18} color={D.primary} />}
            </motion.button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{
                  padding: '8px', borderRadius: 10, border: `1px solid ${D.border}`,
                  background: notificationsOpen ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.05)',
                  cursor: 'pointer', position: 'relative', color: D.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Bell size={18} color={notificationsOpen ? D.primary : D.muted} />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    background: D.red, color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    borderRadius: '50%', width: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${D.bg}`,
                  }}>
                    {unread}
                  </span>
                )}
              </motion.button>

              {/* Dropdown notificaciones */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: 'min(320px, 92vw)', maxHeight: '70vh',
                      background: isDark ? 'rgba(10,15,30,0.98)' : 'rgba(255,255,255,0.98)',
                      border: `1px solid ${D.border}`,
                      borderRadius: 14,
                      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.08)' : '0 8px 32px rgba(0,0,0,0.12)',
                      backdropFilter: 'blur(20px)',
                      overflow: 'hidden', zIndex: 100,
                    }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px',
                      borderBottom: `1px solid ${D.border}`,
                    }}>
                      <h3 style={{ fontWeight: 700, color: D.text, fontSize: 14 }}>Notificaciones</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {unread > 0 && (
                          <button
                            onClick={handleMarcarTodas}
                            title="Marcar todas como leídas"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.primary, display: 'flex', alignItems: 'center' }}
                          >
                            <CheckCheck size={15} />
                          </button>
                        )}
                        <button onClick={() => setNotificationsOpen(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted }}>
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px 16px', textAlign: 'center', color: D.muted, fontSize: 13 }}>
                          No tienes notificaciones
                        </div>
                      ) : notifications.map((n, i) => (
                        <div
                          key={n.id}
                          onClick={() => !n.leida && handleMarcarLeida(n.id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: i < notifications.length - 1 ? `1px solid ${D.border}` : 'none',
                            background: !n.leida ? (isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)') : 'transparent',
                            cursor: !n.leida ? 'pointer' : 'default',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            {!n.leida && (
                              <div style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: D.primary, flexShrink: 0, marginTop: 5,
                              }} />
                            )}
                            <div style={{ flex: 1, paddingLeft: n.leida ? 14 : 0 }}>
                              <h4 style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: '0 0 3px' }}>{n.titulo}</h4>
                              <p style={{ fontSize: 12, color: D.muted, margin: '0 0 4px', lineHeight: 1.4 }}>{n.mensaje}</p>
                              <p style={{ fontSize: 11, color: D.dim }}>{formatTime(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User */}
            <div
              onClick={() => navigate('/dashboard-consumidor/perfil')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              title="Ir a Mi Perfil"
            >
              <div className="hidden md:block" style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{nombreCorto}</p>
                <p style={{ fontSize: 11, color: D.muted }}>Consumidor</p>
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

        {/* Search bar on md+ (flex row) */}
        <div className="hidden md:block" style={{ padding: '0 24px 12px' }}>
          <div style={{ maxWidth: 420, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: D.primary, pointerEvents: 'none' }} />
            <input type="text" placeholder="Buscar productos, productores..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                background: isDark ? 'rgba(34,197,94,0.05)' : D.surface, border: `1px solid ${D.border}`,
                borderRadius: 10, color: D.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = D.primary}
              onBlur={e => e.target.style.borderColor = D.border}
            />
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1 }}>
        <SidebarConsumidor currentTab={currentTab} />
        <main style={{ flex: 1, overflowY: 'auto', background: D.bg }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardConsumidor
