import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Fish, CheckCircle } from 'lucide-react'

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontFamily: "'Fira Sans', sans-serif",
  outline: 'none',
}
const inputFocus = e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; }
const inputBlur  = e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }

const FieldInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />}
    <input
      {...props}
      className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl text-white text-sm transition-all duration-200`}
      style={inputStyle}
      onFocus={inputFocus}
      onBlur={inputBlur}
    />
  </div>
)

const Registro = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', confirmPassword: '', telefono: '', rol_id: 3 })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')
  const [step, setStep]                 = useState(1)

  const { register, loginWithGoogle, error, setError } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (error) setErrorMsg(error) }, [error])
  useEffect(() => () => setError(null), [setError])

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const validateStep1 = () => {
    if (!formData.nombre.trim())       { setErrorMsg('Por favor ingresa tu nombre'); return false }
    if (!formData.email.trim())        { setErrorMsg('Por favor ingresa tu correo'); return false }
    if (!/\S+@\S+\.\S+/.test(formData.email)) { setErrorMsg('Correo inválido'); return false }
    return true
  }
  const validateStep2 = () => {
    if (!formData.password)              { setErrorMsg('Ingresa una contraseña'); return false }
    if (formData.password.length < 6)    { setErrorMsg('Mínimo 6 caracteres'); return false }
    if (formData.password !== formData.confirmPassword) { setErrorMsg('Las contraseñas no coinciden'); return false }
    return true
  }

  const nextStep = () => { if (validateStep1()) { setErrorMsg(''); setStep(2) } }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateStep2()) return
    setIsLoading(true)
    try {
      const { confirmPassword, ...userData } = formData
      await register({ ...userData, rol_id: 3 })
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async credentialResponse => {
    setErrorMsg('')
    const result = await loginWithGoogle(credentialResponse.credential)
    if (result.success) navigate('/dashboard-consumidor')
    else setErrorMsg(result.error || 'Error con Google')
  }

  return (
    <div className="min-h-screen flex np-orb-bg np-grid" style={{ background: '#0a1220' }}>

      {/* ── Branding lateral ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-center w-5/12 p-12 relative overflow-hidden"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.4)' }}>
            <Fish size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "'Fira Code', monospace" }}>NaturaPiscis</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4 leading-tight"
          style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.03em' }}>
          Únete al ecosistema<br />
          <span style={{ color: '#22C55E' }}>acuícola</span>
        </h1>
        <p className="text-slate-400 mb-10" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Regístrate gratis como consumidor y accede al marketplace más completo de productos acuícolas frescos.
        </p>

        {[
          'Acceso a productores verificados',
          'Trazabilidad garantizada en cada compra',
          'Análisis de frescura con inteligencia artificial',
          'Pagos seguros con múltiples métodos',
        ].map((item, i) => (
          <motion.div key={item} className="flex items-center gap-3 mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}>
            <CheckCircle size={16} style={{ color: '#22C55E', flexShrink: 0 }} />
            <span className="text-slate-300 text-sm" style={{ fontFamily: "'Fira Sans', sans-serif" }}>{item}</span>
          </motion.div>
        ))}

        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 65%)', transform: 'translate(-30%, 30%)' }} />
      </motion.div>

      {/* ── Formulario ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <div className="rounded-2xl p-8" style={{
            background: 'rgba(17,30,51,0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(34,197,94,0.16)',
          }}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em' }}>
                  Crear cuenta
                </h2>
                {/* Step indicator */}
                <div className="flex items-center gap-2">
                  {[1, 2].map(s => (
                    <div key={s} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={s === step
                        ? { background: '#22C55E', color: '#fff' }
                        : s < step
                          ? { background: 'rgba(34,197,94,0.2)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#64748b' }
                      }>
                      {s < step ? '✓' : s}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-slate-400 text-sm" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                {step === 1 ? 'Información básica de tu cuenta' : 'Crea tu contraseña segura'}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <span className="flex-1">{errorMsg}</span>
                  <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" className="space-y-4"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Nombre completo *</label>
                      <FieldInput icon={User} name="nombre" type="text" required value={formData.nombre} onChange={handleChange} placeholder="Tu nombre completo" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Correo electrónico *</label>
                      <FieldInput icon={Mail} name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Teléfono <span style={{ color: '#64748b' }}>(opcional)</span></label>
                      <FieldInput icon={Phone} name="telefono" type="tel" value={formData.telefono} onChange={handleChange} placeholder="+591 7XXXXXXX" />
                    </div>
                    <motion.button type="button" onClick={nextStep}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm mt-2 cursor-pointer"
                      style={{ background: '#22C55E', color: '#fff', fontFamily: "'Fira Sans', sans-serif", boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}
                      whileHover={{ y: -1, boxShadow: '0 8px 28px rgba(34,197,94,0.45)' }}
                      whileTap={{ scale: 0.98 }}>
                      <span>Continuar</span><ArrowRight size={16} />
                    </motion.button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" className="space-y-4"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Contraseña *</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
                        <input name="password" type={showPassword ? 'text' : 'password'} required
                          value={formData.password} onChange={handleChange} placeholder="••••••••"
                          className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm transition-all duration-200"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
                          style={{ color: '#64748b' }}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>Mínimo 6 caracteres</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Confirmar contraseña *</label>
                      <FieldInput icon={Lock} name="confirmPassword" type={showPassword ? 'text' : 'password'} required
                        value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <input id="terms" type="checkbox" required className="mt-0.5 w-4 h-4 rounded accent-green-500 cursor-pointer" />
                      <label htmlFor="terms" className="text-sm cursor-pointer" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>
                        Acepto los{' '}
                        <Link to="/terminos" className="transition-colors duration-200" style={{ color: '#22C55E' }}>
                          Términos y Condiciones
                        </Link>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <motion.button type="button" onClick={() => { setStep(1); setErrorMsg('') }}
                        className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}
                        whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.98 }}>
                        <ArrowLeft size={16} /><span>Atrás</span>
                      </motion.button>
                      <motion.button type="submit" disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm cursor-pointer"
                        style={{
                          background: isLoading ? 'rgba(34,197,94,0.5)' : '#22C55E',
                          color: '#fff',
                          fontFamily: "'Fira Sans', sans-serif",
                          boxShadow: isLoading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                        whileHover={isLoading ? {} : { y: -1 }}
                        whileTap={isLoading ? {} : { scale: 0.98 }}>
                        {isLoading
                          ? <><motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /><span>Registrando...</span></>
                          : <span>Crear cuenta</span>}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Divider */}
            <div className="relative flex items-center my-5">
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <span className="mx-3 text-xs" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>o regístrate con</span>
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg('Error al registrarse con Google')}
                theme="filled_black" shape="rectangular" size="large" text="signup_with" locale="es" />
            </div>

            <p className="text-center mt-5 text-sm" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-semibold transition-colors duration-200" style={{ color: '#22C55E' }}>
                Inicia sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Registro
