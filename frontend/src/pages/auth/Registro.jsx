import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  Fish, CheckCircle, Sparkles, AlertCircle, ShoppingBag, Truck, Heart,
} from 'lucide-react'

// ── Paleta verde brand ──
const GREEN  = '#22C55E'
const GREEN2 = '#4ade80'
const GREEN3 = '#16a34a'

// ── Partículas (mismo patrón del WelcomeMenu / Login) ───────────────────
const FloatingParticles = () => {
  const [particles, setParticles] = useState([])
  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: ((i * 137) % 100),
        y: ((i * 53) % 100),
        size: 2 + ((i * 7) % 4),
        delay: (i * 0.4) % 6,
        dur: 5 + ((i * 2) % 6),
      }))
    )
  }, [])
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.id % 3 === 0 ? GREEN2 : GREEN,
            boxShadow: `0 0 ${p.size * 4}px ${p.id % 3 === 0 ? GREEN2 : GREEN}`,
            opacity: 0.35,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Logo orbital ─────────────────────────────────────────────────────────
const AnimatedLogo = ({ size = 'md' }) => {
  const d = size === 'sm'
    ? { wrap: 36, ring1: 36, ring2: 30, core: 22, icon: 11, text: 'text-base' }
    : { wrap: 44, ring1: 44, ring2: 36, core: 28, icon: 15, text: 'text-xl' }
  return (
    <motion.div className="flex items-center cursor-pointer"
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
      <div className="relative mr-3 flex items-center justify-center" style={{ width: d.wrap, height: d.wrap }}>
        <motion.div className="absolute rounded-full border border-dashed"
          style={{ width: d.ring1, height: d.ring1, borderColor: `${GREEN}66` }}
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: 'linear' }} />
        <motion.div className="absolute rounded-full border border-dotted"
          style={{ width: d.ring2, height: d.ring2, borderColor: `${GREEN2}55` }}
          animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }} />
        <motion.div className="rounded-full flex items-center justify-center"
          style={{
            width: d.core, height: d.core,
            background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`,
            boxShadow: `0 0 14px ${GREEN}66`,
          }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
          <Fish size={d.icon} className="text-slate-950" />
        </motion.div>
      </div>
      <div className={`font-bold text-white tracking-wide ${d.text}`} style={{ fontFamily: "'Fira Code', monospace" }}>
        <span>Natura</span><span style={{ color: GREEN2 }} className="ml-0.5">Piscis</span>
      </div>
    </motion.div>
  )
}

// ── Campo con icono + focus glow verde ─────────────────────────────────
const FieldInput = ({ icon: Icon, ...props }) => {
  const [focus, setFocus] = useState(false)
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
        style={{ color: focus ? GREEN2 : '#64748b' }} />}
      <input {...props}
        onFocus={(e) => { setFocus(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocus(false); props.onBlur?.(e) }}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all duration-200`}
        style={{
          background: 'rgba(15,30,22,0.45)',
          border: `1.5px solid ${focus ? GREEN : 'rgba(34,197,94,0.15)'}`,
          boxShadow: focus ? `0 0 16px ${GREEN}33` : 'none',
        }} />
    </div>
  )
}

const Registro = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', confirmPassword: '', telefono: '', rol_id: 3 })
  const [showPassword, setShowPassword] = useState(false)
  const [passFocus, setPassFocus] = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [errorMsg, setErrorMsg]     = useState('')
  const [step, setStep]             = useState(1)

  const { register, loginWithGoogle, error, setError } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (error) setErrorMsg(error) }, [error])
  useEffect(() => () => setError(null), [setError])

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const validateStep1 = () => {
    if (!formData.nombre.trim())                { setErrorMsg('Por favor ingresa tu nombre'); return false }
    if (!formData.email.trim())                 { setErrorMsg('Por favor ingresa tu correo'); return false }
    if (!/\S+@\S+\.\S+/.test(formData.email))   { setErrorMsg('Correo inválido'); return false }
    return true
  }
  const validateStep2 = () => {
    if (!formData.password)                                       { setErrorMsg('Ingresa una contraseña'); return false }
    if (formData.password.length < 6)                             { setErrorMsg('Mínimo 6 caracteres'); return false }
    if (formData.password !== formData.confirmPassword)           { setErrorMsg('Las contraseñas no coinciden'); return false }
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

  // Beneficios visibles en el panel izquierdo (con iconos para diferenciar)
  const benefits = [
    { icon: ShoppingBag, text: 'Reservas con un clic, sin pagar adelantado' },
    { icon: Truck,       text: 'Pescado fresco del Chapare en tu parada' },
    { icon: CheckCircle, text: 'Trazabilidad real desde el estanque' },
    { icon: Heart,       text: 'Apoyas productores acuícolas locales' },
  ]

  return (
    <div className="min-h-screen flex relative overflow-hidden text-slate-100" style={{ background: '#030712' }}>
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#061a10] to-[#030712] z-0" />
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 75% 20%, ${GREEN}1a, transparent 45%)` }} />
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full pointer-events-none z-0"
        style={{ background: `${GREEN}10`, filter: 'blur(105px)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full pointer-events-none z-0"
        style={{ background: `${GREEN2}0c`, filter: 'blur(95px)' }} />

      <FloatingParticles />

      {/* ─────────────── PANEL IZQUIERDO (branding) ─────────────── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 xl:p-16 relative z-10"
        style={{ borderRight: `1px solid ${GREEN}1a` }}
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

        <AnimatedLogo />

        <div>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-6"
            style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}44`, color: GREEN2 }}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Sparkles size={12} className="animate-pulse" />
            <span>ÚNETE GRATIS · CONSUMIDOR</span>
          </motion.div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.03em' }}>
            Pescado fresco<br />
            <span className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(90deg, ${GREEN2}, ${GREEN}, ${GREEN3})`,
                WebkitBackgroundClip: 'text',
                filter: `drop-shadow(0 0 20px ${GREEN}40)`,
              }}>
              al alcance de un clic
            </span>
          </h1>
          <p className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
            Regístrate gratis y reserva pescado directamente del productor acuícola. Sin intermediarios, con trazabilidad.
          </p>

          <div className="space-y-3 max-w-sm">
            {benefits.map(({ icon: Icon, text }, i) => (
              <motion.div key={text}
                className="flex items-center gap-3 p-3.5 rounded-xl backdrop-blur-md hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: 'rgba(15,30,22,0.45)', border: `1px solid ${GREEN}1f` }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}33` }}>
                  <Icon size={15} style={{ color: GREEN2 }} />
                </div>
                <span className="text-slate-300 text-xs tracking-wide leading-snug">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}33`, color: GREEN2, width: 'fit-content' }}>
          <motion.span className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: GREEN2, boxShadow: `0 0 8px ${GREEN2}` }}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <span>Marketplace boliviano · IoT + IA</span>
        </motion.div>
      </motion.div>

      {/* ─────────────── PANEL DERECHO (formulario) ─────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10 relative">
        <motion.div className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <div className="rounded-2xl p-7 sm:p-10 relative overflow-hidden backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            style={{ background: 'rgba(8,20,14,0.65)', border: `1px solid ${GREEN}26` }}>

            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${GREEN2}, ${GREEN}, transparent)` }} />

            {/* Logo móvil */}
            <div className="lg:hidden mb-5 flex justify-center">
              <AnimatedLogo size="sm" />
            </div>

            {/* Header con step indicator */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Fira Code', monospace" }}>
                  Crear cuenta
                </h2>
                <div className="flex items-center gap-2.5">
                  {[1, 2].map(s => (
                    <div key={s}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={s === step
                        ? { background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`, color: '#030712', boxShadow: `0 0 12px ${GREEN}55` }
                        : s < step
                          ? { background: `${GREEN}1f`, color: GREEN2, border: `1px solid ${GREEN}55` }
                          : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }
                      }>
                      {s < step ? '✓' : s}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                {step === 1 ? 'Tus datos básicos' : 'Elige una contraseña segura'}
              </p>
              {/* Progress bar */}
              <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={false}
                  animate={{ width: step === 1 ? '50%' : '100%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${GREEN3}, ${GREEN}, ${GREEN2})` }} />
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5' }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{errorMsg}</span>
                  <button onClick={() => setErrorMsg('')}
                    className="text-red-400 hover:text-red-300 cursor-pointer text-base leading-none">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" className="space-y-4"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wider uppercase text-slate-400">Nombre completo *</label>
                      <FieldInput icon={User} name="nombre" type="text" required value={formData.nombre} onChange={handleChange} placeholder="Tu nombre completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wider uppercase text-slate-400">Correo electrónico *</label>
                      <FieldInput icon={Mail} name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wider uppercase text-slate-400">
                        Teléfono <span className="text-slate-500 normal-case font-normal">(opcional)</span>
                      </label>
                      <FieldInput icon={Phone} name="telefono" type="tel" value={formData.telefono} onChange={handleChange} placeholder="+591 7XXXXXXX" />
                    </div>
                    <motion.button type="button" onClick={nextStep}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-slate-950 text-sm mt-3 cursor-pointer"
                      style={{
                        background: `linear-gradient(90deg, ${GREEN3}, ${GREEN}, ${GREEN2})`,
                        boxShadow: `0 8px 28px ${GREEN}55`,
                      }}
                      whileHover={{ y: -2, boxShadow: `0 12px 36px ${GREEN}88` }}
                      whileTap={{ scale: 0.98 }}>
                      <span>Continuar</span><ArrowRight size={16} />
                    </motion.button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" className="space-y-4"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wider uppercase"
                        style={{ color: passFocus ? GREEN2 : '#94a3b8' }}>Contraseña *</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                          style={{ color: passFocus ? GREEN2 : '#64748b' }} />
                        <input name="password" type={showPassword ? 'text' : 'password'} required
                          value={formData.password} onChange={handleChange} placeholder="••••••••"
                          onFocus={() => setPassFocus(true)} onBlur={() => setPassFocus(false)}
                          className="w-full pl-10 pr-12 py-3.5 rounded-xl text-white text-sm outline-none transition-all"
                          style={{
                            background: 'rgba(15,30,22,0.45)',
                            border: `1.5px solid ${passFocus ? GREEN : 'rgba(34,197,94,0.15)'}`,
                            boxShadow: passFocus ? `0 0 16px ${GREEN}33` : 'none',
                          }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                          style={{ color: passFocus ? GREEN2 : '#64748b' }}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[10px] mt-1.5 text-slate-500">Mínimo 6 caracteres</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wider uppercase text-slate-400">Confirmar contraseña *</label>
                      <FieldInput icon={Lock} name="confirmPassword" type={showPassword ? 'text' : 'password'} required
                        value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <input id="terms" type="checkbox" required className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: GREEN }} />
                      <label htmlFor="terms" className="text-xs cursor-pointer leading-normal text-slate-400">
                        Acepto los{' '}
                        <Link to="/terminos" className="font-semibold transition-colors" style={{ color: GREEN2 }}>
                          Términos y Condiciones
                        </Link>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <motion.button type="button" onClick={() => { setStep(1); setErrorMsg('') }}
                        className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-slate-400 text-sm cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${GREEN}1a` }}
                        whileHover={{ background: `${GREEN}10`, color: '#cbd5e1' }}
                        whileTap={{ scale: 0.98 }}>
                        <ArrowLeft size={16} /><span>Atrás</span>
                      </motion.button>
                      <motion.button type="submit" disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-slate-950 text-sm cursor-pointer"
                        style={{
                          background: `linear-gradient(90deg, ${GREEN3}, ${GREEN}, ${GREEN2})`,
                          boxShadow: isLoading ? 'none' : `0 8px 28px ${GREEN}55`,
                          opacity: isLoading ? 0.85 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                        whileHover={isLoading ? {} : { y: -2, boxShadow: `0 12px 36px ${GREEN}88` }}
                        whileTap={isLoading ? {} : { scale: 0.98 }}>
                        {isLoading
                          ? <>
                              <motion.div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                              <span>Creando...</span>
                            </>
                          : <span>Crear cuenta</span>}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t" style={{ borderColor: `${GREEN}1a` }} />
              <span className="mx-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">o regístrate con</span>
              <div className="flex-grow border-t" style={{ borderColor: `${GREEN}1a` }} />
            </div>

            <div className="flex justify-center rounded-xl overflow-hidden transition"
              style={{ border: `1px solid ${GREEN}26` }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg('Error al registrarse con Google')}
                theme="filled_black" shape="rectangular" size="large" text="signup_with" locale="es" />
            </div>

            <p className="text-center mt-7 text-xs text-slate-500">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-bold transition-colors" style={{ color: GREEN2 }}
                onMouseEnter={e => e.currentTarget.style.color = GREEN}
                onMouseLeave={e => e.currentTarget.style.color = GREEN2}>
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Registro
