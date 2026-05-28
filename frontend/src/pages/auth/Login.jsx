import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mail, Lock, Eye, EyeOff, LogIn, Fish, Activity, Truck,
  ShieldCheck, Sparkles, ArrowRight, AlertCircle,
} from 'lucide-react';
import { USER_ROLES } from '../../constants';

// ── Paleta verde brand ──
const GREEN  = '#22C55E';
const GREEN2 = '#4ade80';
const GREEN3 = '#16a34a';

// ── Partículas flotantes (mismo patrón del WelcomeMenu) ─────────────────
const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);
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
    );
  }, []);
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
  );
};

// ── Logo orbital (igual al WelcomeMenu) ──────────────────────────────────
const AnimatedLogo = ({ size = 'md' }) => {
  const dims = size === 'sm'
    ? { wrap: 36, ring1: 36, ring2: 30, core: 22, icon: 11, text: 'text-base' }
    : { wrap: 44, ring1: 44, ring2: 36, core: 28, icon: 15, text: 'text-xl' };
  return (
    <motion.div className="flex items-center cursor-pointer"
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
      <div className="relative mr-3 flex items-center justify-center" style={{ width: dims.wrap, height: dims.wrap }}>
        <motion.div className="absolute rounded-full border border-dashed"
          style={{ width: dims.ring1, height: dims.ring1, borderColor: `${GREEN}66` }}
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: 'linear' }} />
        <motion.div className="absolute rounded-full border border-dotted"
          style={{ width: dims.ring2, height: dims.ring2, borderColor: `${GREEN2}55` }}
          animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }} />
        <motion.div className="rounded-full flex items-center justify-center"
          style={{
            width: dims.core, height: dims.core,
            background: `linear-gradient(135deg, ${GREEN3}, ${GREEN})`,
            boxShadow: `0 0 14px ${GREEN}66`,
          }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
          <Fish size={dims.icon} className="text-slate-950" />
        </motion.div>
      </div>
      <div className={`font-bold text-white tracking-wide ${dims.text}`} style={{ fontFamily: "'Fira Code', monospace" }}>
        <span>Natura</span><span style={{ color: GREEN2 }} className="ml-0.5">Piscis</span>
      </div>
    </motion.div>
  );
};

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
  const [emailFocus, setEmailFocus]     = useState(false);
  const [passFocus, setPassFocus]       = useState(false);

  const { login, loginWithGoogle, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (error) setErrorMsg(error); }, [error]);
  useEffect(() => () => setError(null), [setError]);

  useEffect(() => {
    if (localStorage.getItem('sesion_expirada')) {
      setErrorMsg('Tu sesión se cerró por inactividad. Inicia sesión de nuevo.');
      localStorage.removeItem('sesion_expirada');
    }
  }, []);

  const routeByRole = (u) => {
    if      (u?.rol_id === USER_ROLES.PRODUCER) navigate('/dashboard-productor');
    else if (u?.rol_id === USER_ROLES.CONSUMER) navigate('/dashboard-consumidor');
    else if (u?.rol_id === USER_ROLES.ADMIN)    navigate('/dashboard-admin');
    else if (u?.rol_id === USER_ROLES.DRIVER)   navigate('/dashboard-repartidor');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Por favor completa todos los campos'); return; }
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) routeByRole(result.usuario);
      else setErrorMsg(result.error || 'Error al iniciar sesión');
    } catch { setErrorMsg('Error al conectar con el servidor'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) routeByRole(result.usuario);
    else setErrorMsg(result.error || 'Error con Google');
  };

  const features = [
    { icon: Fish,        label: 'Marketplace acuícola',   desc: 'Pescado fresco del productor a tu mesa' },
    { icon: Truck,       label: 'Trufi a tu parada',      desc: 'Llega del Chapare a Cochabamba con código único' },
    { icon: Activity,    label: 'Monitoreo IoT en vivo',  desc: 'Sensores y alertas de tus lagunas 24/7' },
    { icon: ShieldCheck, label: 'Trazabilidad completa',  desc: 'Del estanque hasta tu plato, sin atajos' },
  ];

  const inputBase = 'w-full pl-10 pr-12 py-3.5 rounded-xl text-white text-sm outline-none transition-all duration-200';
  const inputBg = 'rgba(15,30,22,0.45)';

  return (
    <div className="min-h-screen flex relative overflow-hidden text-slate-100" style={{ background: '#030712' }}>
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#061a10] to-[#030712] z-0" />
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 25% 20%, ${GREEN}1a, transparent 45%)` }} />
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full pointer-events-none z-0"
        style={{ background: `${GREEN}10`, filter: 'blur(100px)' }} />
      <div className="absolute bottom-[-15%] right-[-5%] w-[45vw] h-[45vw] rounded-full pointer-events-none z-0"
        style={{ background: `${GREEN2}0c`, filter: 'blur(95px)' }} />

      <FloatingParticles />

      {/* ─────────────── PANEL IZQUIERDO (branding) ─────────────── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 relative z-10"
        style={{ borderRight: `1px solid ${GREEN}1a` }}
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>

        <AnimatedLogo />

        <div>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider mb-6"
            style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}44`, color: GREEN2 }}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Sparkles size={12} className="animate-pulse" />
            <span>MARKETPLACE ACUÍCOLA BOLIVIANO</span>
          </motion.div>

          <motion.h1
            className="text-4xl xl:text-5xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.03em' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            Del productor<br />
            <span className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(90deg, ${GREEN2}, ${GREEN}, ${GREEN3})`,
                WebkitBackgroundClip: 'text',
                filter: `drop-shadow(0 0 20px ${GREEN}40)`,
              }}>
              a tu mesa
            </span>
            <br />sin intermediarios
          </motion.h1>
          <p className="text-slate-400 text-base mb-8 max-w-md leading-relaxed">
            Reserva pescado fresco del Chapare, lo recibes en tu parada en Cochabamba. Tecnología IoT y trazabilidad real.
          </p>

          {/* Features con glass cards verticales */}
          <div className="space-y-3 max-w-md">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div key={label}
                className="flex items-start gap-3 p-3.5 rounded-xl backdrop-blur-md hover:-translate-y-0.5 transition-all duration-300"
                style={{
                  background: 'rgba(15,30,22,0.45)',
                  border: `1px solid ${GREEN}1f`,
                }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${GREEN}1a`, border: `1px solid ${GREEN}33` }}>
                  <Icon size={16} style={{ color: GREEN2 }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm tracking-wide">{label}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge "en vivo" */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}33`, color: GREEN2, width: 'fit-content' }}>
          <motion.span className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: GREEN2, boxShadow: `0 0 8px ${GREEN2}` }}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <span>Sistema en línea · IoT + IA</span>
        </motion.div>
      </motion.div>

      {/* ─────────────── PANEL DERECHO (formulario) ─────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10 relative">
        <motion.div className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>

          {/* Card glass */}
          <div className="rounded-2xl p-7 sm:p-10 relative overflow-hidden backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            style={{ background: 'rgba(8,20,14,0.65)', border: `1px solid ${GREEN}26` }}>

            {/* Top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${GREEN2}, ${GREEN}, transparent)` }} />

            {/* Logo móvil */}
            <div className="lg:hidden mb-6 flex justify-center">
              <AnimatedLogo size="sm" />
            </div>

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Fira Code', monospace" }}>
                Bienvenido de vuelta
              </h2>
              <p className="text-slate-400 mt-1.5 text-sm">
                Inicia sesión para continuar
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl mb-6 text-sm"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5' }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}>
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{errorMsg}</span>
                  <button onClick={() => setErrorMsg('')}
                    className="text-red-400 hover:text-red-300 cursor-pointer text-base leading-none">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider uppercase"
                  style={{ color: emailFocus ? GREEN2 : '#94a3b8' }}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                    style={{ color: emailFocus ? GREEN2 : '#64748b' }} />
                  <input type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)}
                    placeholder="correo@ejemplo.com"
                    className={inputBase}
                    style={{
                      background: inputBg,
                      border: `1.5px solid ${emailFocus ? GREEN : 'rgba(34,197,94,0.15)'}`,
                      boxShadow: emailFocus ? `0 0 16px ${GREEN}33` : 'none',
                    }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider uppercase"
                  style={{ color: passFocus ? GREEN2 : '#94a3b8' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                    style={{ color: passFocus ? GREEN2 : '#64748b' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocus(true)} onBlur={() => setPassFocus(false)}
                    placeholder="Tu contraseña"
                    className={inputBase}
                    style={{
                      background: inputBg,
                      border: `1.5px solid ${passFocus ? GREEN : 'rgba(34,197,94,0.15)'}`,
                      boxShadow: passFocus ? `0 0 16px ${GREEN}33` : 'none',
                    }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                    style={{ color: passFocus ? GREEN2 : '#64748b' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: GREEN }} />
                  <span className="text-xs text-slate-400">Recordarme</span>
                </label>
                <button type="button"
                  className="text-xs font-semibold transition-colors cursor-pointer"
                  style={{ color: GREEN2 }}
                  onMouseEnter={e => e.currentTarget.style.color = GREEN}
                  onMouseLeave={e => e.currentTarget.style.color = GREEN2}
                  onClick={() => alert('Recuperación de contraseña próximamente')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit */}
              <motion.button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-slate-950 text-sm cursor-pointer"
                style={{
                  background: isLoading
                    ? `linear-gradient(90deg, ${GREEN3}, ${GREEN})`
                    : `linear-gradient(90deg, ${GREEN3}, ${GREEN}, ${GREEN2})`,
                  boxShadow: isLoading ? 'none' : `0 8px 28px ${GREEN}55`,
                  opacity: isLoading ? 0.85 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
                whileHover={isLoading ? {} : { y: -2, boxShadow: `0 12px 36px ${GREEN}88` }}
                whileTap={isLoading ? {} : { scale: 0.98 }}>
                {isLoading ? (
                  <>
                    <motion.div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative flex items-center pt-1">
                <div className="flex-grow border-t" style={{ borderColor: `${GREEN}1a` }} />
                <span className="mx-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">o continúa con</span>
                <div className="flex-grow border-t" style={{ borderColor: `${GREEN}1a` }} />
              </div>

              {/* Google */}
              <div className="flex justify-center rounded-xl overflow-hidden transition"
                style={{ border: `1px solid ${GREEN}26` }}>
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

            {/* Footer link */}
            <p className="text-center mt-7 text-xs text-slate-500">
              ¿No tienes una cuenta?{' '}
              <Link to="/registro"
                className="font-bold transition-colors"
                style={{ color: GREEN2 }}
                onMouseEnter={e => e.currentTarget.style.color = GREEN}
                onMouseLeave={e => e.currentTarget.style.color = GREEN2}>
                Regístrate gratis
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
  );
};

export default Login;
