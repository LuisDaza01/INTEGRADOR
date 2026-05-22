import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Fish, Droplets, Activity, Shield } from 'lucide-react';
import { USER_ROLES } from '../../constants';

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

  // Aviso cuando la sesión se cerró por inactividad (2 h)
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
    <div className="min-h-screen flex np-orb-bg np-grid" style={{ background: '#0a1220' }}>

      {/* ── Panel izquierdo (branding) ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 z-10 relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.4)' }}>
            <Fish size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "'Fira Code', monospace" }}>
            NaturaPiscis
          </span>
        </div>

        {/* Heading */}
        <div className="z-10 relative">
          <motion.h1
            className="text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.03em' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            La acuicultura<br />
            <span style={{ color: '#22C55E' }}>inteligente</span><br />
            empieza aquí
          </motion.h1>
          <p className="text-slate-400 text-lg mb-10" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Conectamos productores, consumidores y tecnología para transformar la industria acuícola.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <Icon size={16} style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-500 text-sm">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 np-live inline-block" />
            Sistema operativo · v2.0
          </div>
        </div>

        {/* Decorative orb */}
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 65%)', transform: 'translate(-30%, 30%)' }} />
      </motion.div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Card */}
          <div className="rounded-2xl p-8" style={{
            background: 'rgba(17,30,51,0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(34,197,94,0.16)',
          }}>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1 lg:hidden">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}>
                  <Fish size={16} className="text-white" />
                </div>
                <span className="text-white font-bold" style={{ fontFamily: "'Fira Code', monospace" }}>NaturaPiscis</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-3"
                style={{ fontFamily: "'Fira Code', monospace", letterSpacing: '-0.02em' }}>
                Iniciar sesión
              </h2>
              <p className="text-slate-400 mt-1 text-sm" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: "'Fira Sans', sans-serif",
                      outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#64748b' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: "'Fira Sans', sans-serif",
                      outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
                    style={{ color: '#64748b' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
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
                    className="w-4 h-4 rounded accent-green-500" />
                  <span style={{ color: '#94a3b8', fontFamily: "'Fira Sans', sans-serif" }}>Recordarme</span>
                </label>
                <button type="button"
                  className="transition-colors duration-200 cursor-pointer"
                  style={{ color: '#22C55E', fontFamily: "'Fira Sans', sans-serif" }}
                  onClick={() => alert('Recuperación de contraseña próximamente')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer"
                style={{
                  background: isLoading ? 'rgba(34,197,94,0.5)' : '#22C55E',
                  color: '#fff',
                  fontFamily: "'Fira Sans', sans-serif",
                  boxShadow: isLoading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
                whileHover={isLoading ? {} : { y: -1, boxShadow: '0 8px 28px rgba(34,197,94,0.45)' }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
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
                <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <span className="mx-3 text-xs" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>o continúa con</span>
                <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Google login */}
              <div className="flex justify-center">
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
            <p className="text-center mt-6 text-sm" style={{ color: '#64748b', fontFamily: "'Fira Sans', sans-serif" }}>
              ¿No tienes una cuenta?{' '}
              <Link to="/registro"
                className="font-semibold transition-colors duration-200"
                style={{ color: '#22C55E' }}
                onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                onMouseLeave={e => e.currentTarget.style.color = '#22C55E'}
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
