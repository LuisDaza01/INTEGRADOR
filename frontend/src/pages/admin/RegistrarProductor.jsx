import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle, User, Mail, Lock, Phone, MapPin, Building2, Truck } from "lucide-react"
import axiosInstance from "../../api/config/axios"

// ============================================
// Field FUERA del componente principal
// (si está adentro se re-crea en cada render
//  y React pierde el foco del input)
// ============================================
const Field = ({ label, name, type = "text", icon: Icon, placeholder, required = false, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon size={16} className="text-gray-400" />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
      />
    </div>
  </div>
)

// ============================================
// Roles disponibles (fuera también, son datos estáticos)
// ============================================
const ROLES = [
  { val: "2", label: "Productor",  desc: "Acceso al panel de productor",  icon: Building2 },
  { val: "3", label: "Consumidor", desc: "Acceso a la tienda",            icon: User },
  { val: "4", label: "Repartidor", desc: "Conductor que entrega pedidos", icon: Truck },
]

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const RegistrarProductor = () => {
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
        nombre:        form.nombre,
        email:         form.email,
        password:      form.password,
        telefono:      form.telefono      || undefined,
        direccion:     form.direccion     || undefined,
        nombre_empresa:form.nombre_empresa|| undefined,
        descripcion:   form.descripcion   || undefined,
        rol_id:        parseInt(form.rol_id),
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Registrar Usuario</h2>
        <p className="text-gray-500 text-sm mt-1">Solo los administradores pueden crear cuentas de productor, consumidor o repartidor.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Tipo de usuario ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de usuario <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(({ val, label, desc, icon: Icon }) => (
                <button key={val} type="button" onClick={() => setForm(prev => ({ ...prev, rol_id: val }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.rol_id === val ? "bg-blue-50 border-blue-500" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={14} className={form.rol_id === val ? "text-blue-600" : "text-gray-400"} />
                    <p className={`text-sm font-semibold ${form.rol_id === val ? "text-blue-700" : "text-gray-700"}`}>{label}</p>
                  </div>
                  <p className="text-xs text-gray-400">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Datos de acceso ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Datos de acceso</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre completo" name="nombre" icon={User}
                placeholder="Ej: Juan Pérez" required value={form.nombre} onChange={handleChange} />
              <Field label="Email" name="email" type="email" icon={Mail}
                placeholder="correo@ejemplo.com" required value={form.email} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Debe tener mayúscula, minúscula, número y no ser común (ej: <span className="font-medium">Admin123</span>)
                </p>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmar_password"
                    value={form.confirmar_password}
                    onChange={handleChange}
                    placeholder="Repetir contraseña"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Datos adicionales ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Datos adicionales (opcional)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleNumericChange}
                    onKeyDown={blockNonNumeric}
                    placeholder="Ej: 70012345"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Solo números</p>
              </div>

              {/* Empresa (productor/consumidor) o Vehículo (repartidor) */}
              {form.rol_id !== "4" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de empresa</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nombre_empresa"
                      value={form.nombre_empresa}
                      onChange={handleChange}
                      placeholder="Ej: Acuícola del Norte"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehículo / Placa</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Truck size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nombre_empresa"
                      value={form.nombre_empresa}
                      onChange={handleChange}
                      placeholder="Ej: Moto - ABC123"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dirección / Zona */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {form.rol_id === "4" ? "Zona de reparto" : "Dirección / Ubicación"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder={form.rol_id === "4" ? "Ej: Zona Sur, La Paz" : "Ej: Santa Cruz, Bolivia"}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder={form.rol_id === "4" ? "Ej: Repartidor con experiencia en zona sur..." : "Breve descripción..."}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none"
              />
            </div>
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold shadow-sm">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Registrando...</>
              : <><UserPlus size={16} />Registrar {rolActual?.label}</>
            }
          </motion.button>

        </form>
      </motion.div>
    </div>
  )
}

export default RegistrarProductor