"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle, User, Mail, Lock, Phone, MapPin, Building2, Truck } from "lucide-react"
import axiosInstance from "../../api/config/axios"
import { useTheme } from "../../contexts/ThemeContext"

// Field FUERA del componente principal (evita re-creación que pierde foco)
const Field = ({ label, name, type = "text", icon: Icon, placeholder, required, value, onChange, D, ...rest }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 6 }}>
      {label}{required && <span style={{ color: D.red, marginLeft: 2 }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', insetBlock: 0, left: 12, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
        <Icon size={15} style={{ color: D.muted }} />
      </div>
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{
          width: '100%', padding: '10px 14px 10px 38px',
          background: D.inputBg || 'rgba(34,197,94,0.04)',
          border: `1px solid ${D.border}`,
          color: D.text, fontSize: 13,
          borderRadius: 10, outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = D.primary}
        onBlur={e => e.target.style.borderColor = D.border}
        {...rest}
      />
    </div>
  </div>
)

const ROLES = [
  { val: "2", label: "Productor",  desc: "Acceso al panel de productor",  icon: Building2 },
  { val: "3", label: "Consumidor", desc: "Acceso a la tienda",            icon: User },
  { val: "4", label: "Repartidor", desc: "Conductor que entrega pedidos", icon: Truck },
]

const RegistrarProductor = () => {
  const { D } = useTheme()
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", confirmar_password: "",
    telefono: "", direccion: "", nombre_empresa: "", descripcion: "",
    rol_id: "2",
  })
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(null)
  const [error, setError]             = useState(null)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleNumericChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setForm(prev => ({ ...prev, [e.target.name]: val }))
    setError(null)
  }

  const blockNonNumeric = (e) => {
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']
    if (allowed.includes(e.key)) return
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return
    if (!/^[0-9]$/.test(e.key)) e.preventDefault()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setSuccess(null)

    if (!form.nombre || !form.email || !form.password) { setError("Nombre, email y contraseña son obligatorios."); return }
    if (form.password.length < 6)                      { setError("La contraseña debe tener al menos 6 caracteres."); return }
    if (!/(?=.*[a-z])/.test(form.password))            { setError("La contraseña debe contener al menos una letra minúscula."); return }
    if (!/(?=.*[A-Z])/.test(form.password))            { setError("La contraseña debe contener al menos una letra mayúscula."); return }
    if (!/(?=.*\d)/.test(form.password))               { setError("La contraseña debe contener al menos un número."); return }
    const comunes = ['123456','password','123456789','qwerty','abc123']
    if (comunes.includes(form.password.toLowerCase())) { setError("La contraseña es demasiado común. Elige una más segura."); return }
    if (form.password !== form.confirmar_password)     { setError("Las contraseñas no coinciden."); return }

    setLoading(true)
    try {
      await axiosInstance.post("/auth/registro", {
        nombre:         form.nombre,
        email:          form.email,
        password:       form.password,
        telefono:       form.telefono       || undefined,
        direccion:      form.direccion      || undefined,
        nombre_empresa: form.nombre_empresa || undefined,
        descripcion:    form.descripcion    || undefined,
        rol_id:         parseInt(form.rol_id),
      })
      const rolNombre = { "2": "Productor", "3": "Consumidor", "4": "Repartidor" }[form.rol_id] || "Usuario"
      setSuccess(`${rolNombre} "${form.nombre}" registrado correctamente.`)
      setForm({ nombre: "", email: "", password: "", confirmar_password: "", telefono: "", direccion: "", nombre_empresa: "", descripcion: "", rol_id: "2" })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Error al registrar usuario.")
    } finally {
      setLoading(false)
    }
  }

  const rolActual = ROLES.find(r => r.val === form.rol_id)

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: D.muted, marginBottom: 6 }
  const inputStyle = {
    width: '100%', padding: '10px 38px 10px 38px',
    background: D.inputBg || 'rgba(34,197,94,0.04)', border: `1px solid ${D.border}`,
    color: D.text, fontSize: 13, borderRadius: 10, outline: 'none', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.5px' }}>Registrar Usuario</h2>
        <p style={{ color: D.muted, fontSize: 13, margin: '4px 0 0' }}>Solo los administradores pueden crear cuentas de productor, consumidor o repartidor.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            }}>
            <CheckCircle size={18} style={{ color: D.primary, marginTop: 1, flexShrink: 0 }} />
            <p style={{ color: D.primary, fontSize: 13, margin: 0 }}>{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            }}>
            <AlertCircle size={18} style={{ color: D.red, marginTop: 1, flexShrink: 0 }} />
            <p style={{ color: D.red, fontSize: 13, margin: 0 }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: D.card, borderRadius: 18,
          border: `1px solid ${D.border}`, padding: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Tipo de usuario ── */}
          <div>
            <label style={labelStyle}>
              Tipo de usuario <span style={{ color: D.red }}>*</span>
            </label>
            <div className="np-roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <style>{`@media (max-width: 600px) { .np-roles-grid { grid-template-columns: 1fr !important; } }`}</style>
              {ROLES.map(({ val, label, desc, icon: Icon }) => {
                const sel = form.rol_id === val
                return (
                  <button key={val} type="button" onClick={() => setForm(prev => ({ ...prev, rol_id: val }))}
                    style={{
                      padding: 12, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      background: sel ? 'rgba(34,197,94,0.12)' : D.inputBg || 'rgba(255,255,255,0.03)',
                      border: `1px solid ${sel ? D.primary : D.border}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon size={14} style={{ color: sel ? D.primary : D.muted }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: sel ? D.primary : D.text, margin: 0 }}>{label}</p>
                    </div>
                    <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${D.border}` }} />

          {/* ── Datos de acceso ── */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Datos de acceso</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Field D={D} label="Nombre completo" name="nombre" icon={User} placeholder="Ej: Juan Pérez" required value={form.nombre} onChange={handleChange} />
              <Field D={D} label="Email" name="email" type="email" icon={Mail} placeholder="correo@ejemplo.com" required value={form.email} onChange={handleChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
              {/* Contraseña */}
              <div>
                <label style={labelStyle}>
                  Contraseña <span style={{ color: D.red }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', insetBlock: 0, left: 12, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <Lock size={15} style={{ color: D.muted }} />
                  </div>
                  <input
                    type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                    placeholder="Mínimo 6 caracteres" required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = D.primary}
                    onBlur={e => e.target.style.borderColor = D.border}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', insetBlock: 0, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: D.muted, display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p style={{ fontSize: 10, color: D.muted, margin: '6px 0 0' }}>
                  Debe tener mayúscula, minúscula, número y no ser común (ej: <span style={{ color: D.text, fontWeight: 600 }}>Admin123</span>)
                </p>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label style={labelStyle}>
                  Confirmar contraseña <span style={{ color: D.red }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', insetBlock: 0, left: 12, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <Lock size={15} style={{ color: D.muted }} />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"} name="confirmar_password" value={form.confirmar_password} onChange={handleChange}
                    placeholder="Repetir contraseña" required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = D.primary}
                    onBlur={e => e.target.style.borderColor = D.border}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    style={{ position: 'absolute', insetBlock: 0, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: D.muted, display: 'flex', alignItems: 'center' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${D.border}` }} />

          {/* ── Datos adicionales ── */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
              Datos adicionales (opcional)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Field D={D} label="Teléfono" name="telefono" icon={Phone} placeholder="Ej: 70012345"
                value={form.telefono} onChange={handleNumericChange} onKeyDown={blockNonNumeric} inputMode="numeric" />
              {form.rol_id !== "4" ? (
                <Field D={D} label="Nombre de empresa" name="nombre_empresa" icon={Building2}
                  placeholder="Ej: Acuícola del Norte" value={form.nombre_empresa} onChange={handleChange} />
              ) : (
                <Field D={D} label="Vehículo / Placa" name="nombre_empresa" icon={Truck}
                  placeholder="Ej: Moto - ABC123" value={form.nombre_empresa} onChange={handleChange} />
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <Field D={D}
                label={form.rol_id === "4" ? "Zona de reparto" : "Dirección / Ubicación"}
                name="direccion" icon={MapPin}
                placeholder={form.rol_id === "4" ? "Ej: Zona Sur, La Paz" : "Ej: Santa Cruz, Bolivia"}
                value={form.direccion} onChange={handleChange} />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Descripción</label>
              <textarea
                name="descripcion" value={form.descripcion} onChange={handleChange}
                placeholder={form.rol_id === "4" ? "Ej: Repartidor con experiencia en zona sur..." : "Breve descripción..."}
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: D.inputBg || 'rgba(34,197,94,0.04)', border: `1px solid ${D.border}`,
                  color: D.text, fontSize: 13, borderRadius: 10, outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = D.primary}
                onBlur={e => e.target.style.borderColor = D.border}
              />
            </div>
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg,#16a34a,#22C55E)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
              minHeight: 48,
            }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Registrando…</>
              : <><UserPlus size={16} /> Registrar {rolActual?.label}</>
            }
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </motion.button>

        </form>
      </motion.div>
    </div>
  )
}

export default RegistrarProductor
