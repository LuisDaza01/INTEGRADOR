import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Fish, Droplets, Activity, Shield, Sparkles } from 'lucide-react';
import { USER_ROLES } from '../../constants';

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
  { delay: 0,    size: 4, x: 15, y: 10, color: '#00F5FF', duration: 5500 },
  { delay: 600,  size: 3, x: 35, y: 15, color: '#00FF88', duration: 4800 },
  { delay: 1200, size: 5, x: 55, y: 5,  color: '#BF5AF2', duration: 6200 },
  { delay: 1800, size: 3, x: 75, y: 20, color: '#00F5FF', duration: 5000 },
  { delay: 2400, size: 4, x: 90, y: 10, color: '#00FF88', duration: 5800 },
  { delay: 800,  size: 3, x: 45, y: 30, color: '#FF00E5', duration: 5200 },
];

const Login = () => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [rememberMe, setRememberMe]   = useState(false);

  const { login, loginWithGoogle, error, isAuthenticated, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (error) setErrorMsg(error); }, [error]);
  useEffect(() => () => setError(null), [setError]);

  useEffect(() => {
    if (localStorage.getItem('sesion_expirada')) {
      setErrorMsg('Tu sesión se cerró por inactividad. Inicia sesión de nuevo.');
      localStorage.removeItem('sesion_expirada');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Por favor completa todos los campos'); return; }
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        const u = result.usuario;
        if      (u?.rol_id === USER_ROLES.PRODUCER) navigate('/dashboard-productor');
        else if (u?.rol_id === USER_ROLES.CONSUMER)  navigate('/dashboard-consumidor');
        else if (u?.rol_id === USER_ROLES.ADMIN)     navigate('/dashboard-admin');
        else navigate('/');
      } else {
        setErrorMsg(result.error || 'Error al iniciar sesión');
      }
    } catch {
      setErrorMsg('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      const u = result.usuario;
      if      (u?.rol_id === USER_ROLES.PRODUCER) navigate('/dashboard-productor');
      else if (u?.rol_id === USER_ROLES.CONSUMER)  navigate('/dashboard-consumidor');
      else if (u?.rol_id === USER_ROLES.ADMIN)     navigate('/dashboard-admin');
      else navigate('/');
    } else {
      setErrorMsg(result.error || 'Error con Google');
    }
  };

  const features = [
    { icon: Fish,     label: 'Marketplace acuícola',     desc: 'Compra y vende productos frescos directamente' },
    { icon: Activity, label: 'Monitoreo IoT en tiempo real', desc: 'Sensores inteligentes para tus lagunas' },
    { icon: Droplets, label: 'Trazabilidad completa',    desc: 'Del estanque a tu mesa, totalmente rastreable' },
    { icon: Shield,   label: 'Pagos seguros',            desc: 'QR, transferencia, efectivo y más' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#030712] np-grid">
      
      {/* Orbes de luz de fondo con difuminado */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[95px] pointer-events-none z-0" />

      {/* Partículas flotantes holográficas */}
      {PARTICLES.map((p, idx) => (
        <FloatingParticle key={idx} {...p} />
      ))}

      {/* ── Panel izquierdo (branding) ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden z-10 border-r border-cyan-500/10"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Logo con órbitas giratorias */}
        <div className="flex items-center gap-3 z-10 relative">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <motion.div className="absolute w-10 h-10 rounded-full border border-dashed border-cyan-400/40"
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} />
            <motion.div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}>
              <Fish size={13} className="text-slate-950" />
            </motion.div>
          </div>
          <span className="text-white font-bold text-lg tracking-wider" style={{ fontFamily: "'Fira Code', monospace" }}>
            NaturaPiscis
          </span>
        </div>

        {/* Heading */}
        <div className="z-10 relative">
          <motion.div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 mb-6"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>ACUICULTURA DIGITAL INTELIGENTE</span>
          </motion.div>

          <motion.h1
            className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.03em' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            La acuicultura<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">inteligente</span><br />
            empieza aquí
          </motion.h1>
          <p className="text-slate-400 text-base mb-10 max-w-md leading-relaxed" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Conectamos productores, consumidores y tecnología cuántica IoT para transformar la industria acuícola.
          </p>

          {/* Feature list - Glassmorphic item */}
          <div className="space-y-4 max-w-md">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                className="flex items-start gap-4 p-4 rounded-xl backdrop-blur-md bg-slate-900/25 border border-cyan-500/10 hover:border-cyan-400/25 hover:shadow-[0_0_15px_rgba(6,182,212,0.06)] transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Icon size={16} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm tracking-wide">{label}</p>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="z-10 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-cyan-500/15 bg-cyan-950/15 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 np-live inline-block animate-ping" />
            <span>Sistema Operativo · v2.1 (Quantum IoT)</span>
          </div>
        </div>
      </motion.div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Card Glassmorphic */}
          <div className="rounded-2xl p-6 sm:p-10 relative overflow-hidden backdrop-blur-2xl bg-slate-900/40 border border-cyan-500/15 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            {/* Top shimmer line neón */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 lg:hidden">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full border border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '8s' }} />
                  <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Fish size={10} className="text-slate-950" />
                  </div>
                </div>
                <span className="text-white font-bold tracking-wider" style={{ fontFamily: "'Fira Code', monospace" }}>NaturaPiscis</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-4 tracking-wide"
                style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em' }}>
                Iniciar sesión
              </h2>
              <p className="text-slate-400 mt-1.5 text-sm" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  className="flex items-center gap-2 p-3 rounded-xl mb-6 text-sm"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="flex-1">{errorMsg}</span>
                  <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide uppercase"
                  style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                    style={{ color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 transition-all duration-200 outline-none focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(6,182,212,0.18)]"
                    style={{ fontFamily: "'Fira Sans', sans-serif" }}
                    onFocus={e => {
                      e.target.previousSibling.style.color = '#00F5FF';
                    }}
                    onBlur={e => {
                      e.target.previousSibling.style.color = '#64748b';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide uppercase"
                  style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                    style={{ color: '#64748b' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 transition-all duration-200 outline-none focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(6,182,212,0.18)]"
                    style={{ fontFamily: "'Fira Sans', sans-serif" }}
                    onFocus={e => {
                      e.target.previousSibling.style.color = '#00F5FF';
                    }}
                    onBlur={e => {
                      e.target.previousSibling.style.color = '#64748b';
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
                    style={{ color: '#64748b' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#00F5FF'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-500 bg-white/5 border-white/10" />
                  <span className="text-xs" style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Recordarme</span>
                </label>
                <button type="button"
                  className="text-xs transition-colors duration-200 cursor-pointer font-semibold hover:text-cyan-300"
                  style={{ color: '#00F5FF', fontFamily: "'Fira Sans', sans-serif" }}
                  onClick={() => alert('Recuperación de contraseña próximamente')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-slate-950 text-sm transition-all duration-200 cursor-pointer"
                style={{
                  background: isLoading ? 'rgba(0,245,255,0.45)' : 'linear-gradient(90deg, #00F5FF, #00FF88)',
                  boxShadow: isLoading ? 'none' : '0 4px 20px rgba(6,182,212,0.25)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
                whileHover={isLoading ? {} : { y: -1, boxShadow: '0 8px 28px rgba(6,182,212,0.45)' }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <motion.div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <LogIn size={16} />
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <span className="mx-3 text-[10px] uppercase font-bold tracking-wider" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>o continúa con</span>
                <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Google login */}
              <div className="flex justify-center border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-cyan-500/25 transition">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrorMsg('Error al iniciar sesión con Google')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  locale="es"
                />
              </div>
            </form>

            {/* Footer */}
            <p className="text-center mt-8 text-xs" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>
              ¿No tienes una cuenta?{' '}
              <Link to="/registro"
                className="font-bold transition-colors duration-200"
                style={{ color: '#00F5FF' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00FF88'}
                onMouseLeave={e => e.currentTarget.style.color = '#00F5FF'}
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
