"use client"
// Header user menu: avatar clickeable → dropdown con cerrar sesión + modal de confirmación.
// Se usa en los 4 dashboards (admin, productor, consumidor, repartidor) para mantener
// el mismo patrón en todos lados.
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, AlertCircle, Shield, Store, User as UserIcon, Truck } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"

const ROLE_META = {
  admin:      { label: "Administrador", Icon: Shield },
  productor:  { label: "Productor",     Icon: Store  },
  consumidor: { label: "Consumidor",    Icon: UserIcon },
  repartidor: { label: "Repartidor",    Icon: Truck  },
}

const UserMenu = ({ role = "consumidor", showLabel = true }) => {
  const { user, logout } = useAuth()
  const { D } = useTheme()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const wrapperRef = useRef(null)

  const meta = ROLE_META[role] || ROLE_META.consumidor
  const Icon = meta.Icon

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "U"
  const nombreCorto = user?.nombre?.split(" ")[0] || meta.label

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const handleLogout = () => {
    setConfirmOpen(false)
    setOpen(false)
    logout?.()
  }

  return (
    <>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: showLabel ? '4px 4px 4px 10px' : 4,
            border: `1px solid ${open ? D.primary : D.border}`,
            borderRadius: 999,
            background: open ? 'rgba(34,197,94,0.08)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
          {showLabel && (
            <div className="hidden md:block" style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: 0 }}>{nombreCorto}</p>
              <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{meta.label}</p>
            </div>
          )}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg,#16a34a,#22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
            boxShadow: '0 0 12px rgba(34,197,94,0.3)',
            border: `2px solid rgba(34,197,94,0.3)`,
            flexShrink: 0,
          }}>{iniciales}</div>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 240, zIndex: 50,
                background: D.surface || D.card, border: `1px solid ${D.border}`,
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                overflow: 'hidden',
              }}>
              {/* Mini perfil */}
              <div style={{ padding: 14, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#16a34a,#22C55E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{iniciales}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.nombre || meta.label}
                  </p>
                  <p style={{ fontSize: 11, color: D.primary, margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={10} />
                    {meta.label}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ padding: 6 }}>
                <button
                  onClick={() => { setOpen(false); setConfirmOpen(true) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    border: 'none', background: 'transparent',
                    color: '#ef4444', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal confirmación — portal a document.body para escapar de
          ancestros con transform/filter que rompen position:fixed */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {confirmOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}>
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: D.surface || D.card, border: `1px solid ${D.border}`,
                  borderRadius: 18, padding: 28,
                  maxWidth: 380, width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center',
                }}>
                <div style={{
                  margin: '0 auto 14px', width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertCircle size={26} color="#ef4444" />
                </div>
                <h3 style={{ fontWeight: 700, color: D.text, fontSize: 18, margin: '0 0 8px' }}>¿Cerrar Sesión?</h3>
                <p style={{ color: D.muted, fontSize: 14, margin: '0 0 20px' }}>
                  Vas a salir de tu cuenta. ¿Estás seguro?
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmOpen(false)} style={{
                    flex: 1, padding: '12px 0', borderRadius: 10,
                    border: `1px solid ${D.border}`, background: D.card || D.surface,
                    color: D.text, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                    Cancelar
                  </button>
                  <button onClick={handleLogout} style={{
                    flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(239,68,68,0.3)',
                  }}>
                    Sí, cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default UserMenu
