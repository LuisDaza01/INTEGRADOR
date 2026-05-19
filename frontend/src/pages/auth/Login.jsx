// ============================================
// Login Page
// Página de inicio de sesión con diseño moderno
// ============================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Fish, ArrowLeft } from 'lucide-react';
import { USER_ROLES } from '../../constants';

// ============================================
// LOGIN COMPONENT
// ============================================

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loginWithGoogle, error, isAuthenticated, setError } = useAuth();
  const navigate = useNavigate();

  // Actualizar mensaje de error cuando cambia el error en el contexto
  useEffect(() => {
    if (error) {
      setErrorMsg(error);
    }
  }, [error]);

  // Limpiar error al desmontar
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  // ============================================
  // HANDLE SUBMIT - CORREGIDO
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Intentando iniciar sesión con:', { email });

      const result = await login(email, password);

      // Verificar si el login fue exitoso
      if (result.success) {
        const user = result.usuario;

        console.log('✅ Login exitoso, usuario:', user);

        // Redirigir según rol usando constantes
        if (user?.rol_id === USER_ROLES.PRODUCER) {
          console.log('📍 Redirigiendo a dashboard productor');
          navigate('/dashboard-productor');
        } else if (user?.rol_id === USER_ROLES.CONSUMER) {
          console.log('📍 Redirigiendo a dashboard consumidor');
          navigate('/dashboard-consumidor');
        } else if (user?.rol_id === USER_ROLES.ADMIN) {
          console.log('📍 Redirigiendo a dashboard admin');
          navigate('/dashboard-admin');
        } else {
          console.log('📍 Rol desconocido, redirigiendo a inicio');
          navigate('/');
        }
      } else {
        // Mostrar error del login
        console.error('❌ Login falló:', result.error);
        setErrorMsg(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('❌ Error de login:', error);
      setErrorMsg('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Status bar simulado */}
      <div className="flex justify-between items-center px-6 py-3 text-white text-sm font-medium">
        <div className="flex items-center space-x-2">
          <ArrowLeft size={16} />
          <span>19:06</span>
          <span className="text-slate-400">Cámara</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
          <svg className="w-4 h-4 ml-1" fill="white" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <div className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">67</div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 px-6 py-8">
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo y título */}
          <div className="text-center mb-12">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Fish size={32} className="text-white" />
            </motion.div>

            <motion.h1
              className="text-4xl font-bold text-white mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              NaturaPiscis
            </motion.h1>

            <motion.p
              className="text-slate-400 text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Bienvenido de nuevo a tu ecosistema acuático
            </motion.p>
          </div>

          {/* Mensaje de error */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-2xl mb-6 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel de depuración */}
          <AnimatePresence>
            {showDebug && (
              <motion.div
                className="bg-slate-700/50 text-slate-300 p-3 rounded-2xl mb-6 text-xs border border-slate-600"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-bold mb-1">Información de depuración:</h3>
                <p>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}</p>
                <p>Autenticado: {isAuthenticated ? 'Sí' : 'No'}</p>
                <p>Cargando: {isLoading ? 'Sí' : 'No'}</p>
                <button
                  className="mt-2 px-2 py-1 bg-blue-500/30 rounded text-xs"
                  onClick={() => setShowDebug(false)}
                >
                  Ocultar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Correo Electrónico */}
            <div>
              <label className="block text-white font-medium mb-3 text-base">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-white font-medium mb-3 text-base">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Opciones */}
            <div className="flex items-center justify-between">
              <motion.label
                className="flex items-center space-x-3 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-slate-600 rounded bg-slate-700"
                />
                <span className="text-slate-300">Recordarme</span>
              </motion.label>

              <motion.button
                type="button"
                onClick={() => alert('Funcionalidad de recuperación de contraseña próximamente')}
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ¿Olvidaste tu contraseña?
              </motion.button>
            </div>

            {/* Botón de login */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg text-lg ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <LogIn size={20} />
                </>
              )}
            </motion.button>

            {/* Separador */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-600"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-sm">o</span>
              <div className="flex-grow border-t border-slate-600"></div>
            </div>

            {/* Botones sociales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setErrorMsg('');
                    const result = await loginWithGoogle(credentialResponse.credential);
                    if (result.success) {
                      const u = result.usuario;
                      if (u?.rol_id === USER_ROLES.PRODUCER)       navigate('/dashboard-productor');
                      else if (u?.rol_id === USER_ROLES.CONSUMER)  navigate('/dashboard-consumidor');
                      else if (u?.rol_id === USER_ROLES.ADMIN)     navigate('/dashboard-admin');
                      else navigate('/');
                    } else {
                      setErrorMsg(result.error || 'Error con Google');
                    }
                  }}
                  onError={() => setErrorMsg('Error al iniciar sesión con Google')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  locale="es"
                />
              </div>

              <motion.button
                type="button"
                onClick={() => alert('Login con Apple próximamente')}
                className="flex items-center justify-center space-x-2 py-4 px-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white hover:bg-slate-700 hover:border-slate-600 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M14.94,5.19A4.38,4.38,0,0,0,16,2,4.44,4.44,0,0,0,13,3.52,4.17,4.17,0,0,0,12,6.61,3.69,3.69,0,0,0,14.94,5.19Zm2.52,7.44a4.51,4.51,0,0,1,2.16-3.81,4.66,4.66,0,0,0-3.66-2c-1.56-.16-3,.91-3.83.91s-2-.89-3.3-.87A4.92,4.92,0,0,0,4.69,9.39C2.93,12.45,4.24,17,6,19.47,6.8,20.68,7.8,22.05,9.12,22s1.75-.82,3.28-.82s2,.82,3.3.79s2.22-1.23,3.06-2.45a11,11,0,0,0,1.38-2.85A4.41,4.41,0,0,1,17.46,12.63Z" />
                </svg>
                <span className="font-medium">Apple</span>
              </motion.button>
            </div>
          </form>

          {/* Footer */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-slate-400">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/registro"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
              >
                Regístrate aquí
              </Link>
            </p>
          </motion.div>

          {/* Botón para mostrar información de depuración */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors duration-200"
            >
              {showDebug ? 'Ocultar debug' : 'Debug'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Indicador inferior */}
      <div className="flex justify-center pb-6">
        <div className="w-32 h-1 bg-white/30 rounded-full"></div>
      </div>
    </div>
  );
};

export default Login;