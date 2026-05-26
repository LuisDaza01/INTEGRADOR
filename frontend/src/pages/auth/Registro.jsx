import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Fish, CheckCircle, Sparkles } from 'lucide-react'

// ── Partículas flotantes de fondo ──
const FloatingParticle = ({ delay, size, x, y, color, duration }) => {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none z-0"
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}`,
      }}
      animate={{
        y: [0, -250],
        opacity: [0, 0.75, 0],
      }}
      transition={{
        duration: duration / 1000,
        repeat: Infinity,
        delay: delay / 1000,
        ease: "easeOut",
      }}
    />
  );
};

const PARTICLES = [
  { delay: 0,    size: 4, x: 20, y: 15, color: '#00FF88', duration: 5200 },
  { delay: 500,  size: 3, x: 40, y: 10, color: '#00F5FF', duration: 4500 },
  { delay: 1000, size: 5, x: 60, y: 20, color: '#BF5AF2', duration: 6000 },
  { delay: 1500, size: 3, x: 80, y: 5,  color: '#00FF88', duration: 5000 },
];

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontFamily: "'Fira Sans', sans-serif",
  outline: 'none',
}

const FieldInput = ({ icon: Icon, onFocus, onBlur, ...props }) => {
  const iconRef = useRef(null)
  return (
    <div className="relative">
      {Icon && <Icon size={16} ref={iconRef} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" style={{ color: '#64748b' }} />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl text-white text-sm transition-all duration-200 bg-white/5 border border-white/10 focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.18)] outline-none`}
        style={inputStyle}
        onFocus={e => {
          if (iconRef.current) iconRef.current.style.color = '#00FF88';
          onFocus?.(e);
        }}
        onBlur={e => {
          if (iconRef.current) iconRef.current.style.color = '#64748b';
          onBlur?.(e);
        }}
      />
    </div>
  )
}

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
    <div className="min-h-screen flex relative overflow-hidden bg-[#030712] np-grid">
      
      {/* Orbes de luz de fondo */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[105px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[95px] pointer-events-none z-0" />

      {/* Partículas holográficas */}
      {PARTICLES.map((p, idx) => (
        <FloatingParticle key={idx} {...p} />
      ))}

      {/* ── Branding lateral ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-5/12 p-16 relative overflow-hidden z-10 border-r border-cyan-500/10"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Logo orbital */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <motion.div className="absolute w-10 h-10 rounded-full border border-dashed border-cyan-400/40"
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 11, ease: "linear" }} />
            <motion.div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
              <Fish size={13} className="text-slate-950" />
            </motion.div>
          </div>
          <span className="text-white font-bold text-lg tracking-wider" style={{ fontFamily: "'Fira Code', monospace" }}>NaturaPiscis</span>
        </div>

        <div>
          <motion.div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 mb-6"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>ACCESO AL PORTAL DE CONSUMIDOR</span>
          </motion.div>

          <h1 className="text-4xl font-extrabold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.03em' }}>
            Únete al ecosistema<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">acuícola</span>
          </h1>
          <p className="text-slate-400 text-sm mb-10 max-w-sm leading-relaxed" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Regístrate gratis como consumidor y accede al marketplace cuántico más completo de productos acuícolas frescos del Chapare.
          </p>

          <div className="space-y-3.5 max-w-sm">
            {[
              'Acceso a productores verificados',
              'Trazabilidad garantizada en cada compra',
              'Análisis de frescura con inteligencia artificial',
              'Pagos seguros con múltiples métodos',
            ].map((item, i) => (
              <motion.div key={item} className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-md bg-slate-900/20 border border-emerald-500/10 hover:border-emerald-400/20 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}>
                <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-xs tracking-wide" style={{ fontFamily: "'Fira Sans', sans-serif" }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom indicator */}
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/15 bg-emerald-950/15 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 np-live inline-block animate-pulse" />
            <span>Infraestructura de Comercio Directo</span>
          </div>
        </div>
      </motion.div>

      {/* ── Formulario ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 z-10">
        <motion.div className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          {/* Card Glass */}
          <div className="rounded-2xl p-6 sm:p-10 relative overflow-hidden backdrop-blur-2xl bg-slate-900/40 border border-emerald-500/15 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            {/* Top shimmer line neón */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white tracking-wide"
                  style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em' }}>
                  Crear cuenta
                </h2>
                {/* Step indicator */}
                <div className="flex items-center gap-2.5">
                  {[1, 2].map(s => (
                    <div key={s} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={s === step
                        ? { background: 'linear-gradient(90deg, #00FF88, #10B981)', color: '#030712', boxShadow: '0 0 10px rgba(0,255,136,0.3)' }
                        : s < step
                          ? { background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' }
                      }>
                      {s < step ? '✓' : s}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                {step === 1 ? 'Información básica de tu cuenta' : 'Crea tu contraseña segura'}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
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
                  <motion.div key="s1" className="space-y-5"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Nombre completo *</label>
                      <FieldInput icon={User} name="nombre" type="text" required value={formData.nombre} onChange={handleChange} placeholder="Tu nombre completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Correo electrónico *</label>
                      <FieldInput icon={Mail} name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Teléfono <span style={{ color: '#64748b' }}>(opcional)</span></label>
                      <FieldInput icon={Phone} name="telefono" type="tel" value={formData.telefono} onChange={handleChange} placeholder="+591 7XXXXXXX" />
                    </div>
                    <motion.button type="button" onClick={nextStep}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-slate-950 text-sm mt-3 cursor-pointer"
                      style={{ background: 'linear-gradient(90deg, #00FF88, #10B981)', boxShadow: '0 4px 20px rgba(0,255,136,0.25)' }}
                      whileHover={{ y: -1, boxShadow: '0 8px 28px rgba(0,255,136,0.35)' }}
                      whileTap={{ scale: 0.98 }}>
                      <span>Continuar</span><ArrowRight size={15} />
                    </motion.button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" className="space-y-5"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Contraseña *</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" style={{ color: '#64748b' }} />
                        <input name="password" type={showPassword ? 'text' : 'password'} required
                          value={formData.password} onChange={handleChange} placeholder="••••••••"
                          className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm transition-all duration-200 bg-white/5 border border-white/10 focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.18)] outline-none"
                          style={inputStyle}
                          onFocus={e => { e.target.previousSibling.style.color = '#00FF88' }}
                          onBlur={e => { e.target.previousSibling.style.color = '#64748b' }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
                          style={{ color: '#64748b' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#00FF88'}
                          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[10px] mt-1.5" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>Mínimo 6 caracteres</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Confirmar contraseña *</label>
                      <FieldInput icon={Lock} name="confirmPassword" type={showPassword ? 'text' : 'password'} required
                        value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <input id="terms" type="checkbox" required className="mt-0.5 w-4 h-4 rounded accent-emerald-500 bg-white/5 border-white/10 cursor-pointer" />
                      <label htmlFor="terms" className="text-xs cursor-pointer leading-normal" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>
                        Acepto los{' '}
                        <Link to="/terminos" className="font-semibold transition-colors duration-200" style={{ color: '#00FF88' }}>
                          Términos y Condiciones
                        </Link>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <motion.button type="button" onClick={() => { setStep(1); setErrorMsg('') }}
                        className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-slate-400 text-sm cursor-pointer border border-white/10 hover:border-white/20 transition-all bg-white/5"
                        style={{ fontFamily: "'Fira Sans', sans-serif" }}
                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}>
                        <ArrowLeft size={16} /><span>Atrás</span>
                      </motion.button>
                      <motion.button type="submit" disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-slate-950 text-sm cursor-pointer"
                        style={{
                          background: isLoading ? 'rgba(0,255,136,0.45)' : 'linear-gradient(90deg, #00FF88, #10B981)',
                          boxShadow: isLoading ? 'none' : '0 4px 20px rgba(0,255,136,0.25)',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                        whileHover={isLoading ? {} : { y: -1, boxShadow: '0 8px 28px rgba(0,255,136,0.35)' }}
                        whileTap={isLoading ? {} : { scale: 0.98 }}>
                        {isLoading
                          ? <><motion.div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /><span>Registrando...</span></>
                          : <span>Crear cuenta</span>}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <span className="mx-3 text-[10px] uppercase font-bold tracking-wider" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>o regístrate con</span>
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            </div>

            <div className="flex justify-center border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-emerald-500/25 transition">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg('Error al registrarse con Google')}
                theme="filled_black" shape="rectangular" size="large" text="signup_with" locale="es" />
            </div>

            <p className="text-center mt-8 text-xs" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-bold transition-colors duration-200" style={{ color: '#00FF88' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00F5FF'}
                onMouseLeave={e => e.currentTarget.style.color = '#00FF88'}>
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
