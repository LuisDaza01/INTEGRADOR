import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { GoogleLogin } from "@react-oauth/google"
import { useAuth } from "../../contexts/AuthContext"
import { User, Mail, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, Fish } from "lucide-react"

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    rol_id: 3, // Siempre consumidor
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [step, setStep] = useState(1)

  const { register, loginWithGoogle, error, setError } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (error) setErrorMsg(error) }, [error])
  useEffect(() => { return () => { setError(null) } }, [setError])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateStep1 = () => {
    if (!formData.nombre.trim()) { setErrorMsg("Por favor ingresa tu nombre"); return false }
    if (!formData.email.trim()) { setErrorMsg("Por favor ingresa tu correo electrónico"); return false }
    if (!/\S+@\S+\.\S+/.test(formData.email)) { setErrorMsg("Por favor ingresa un correo válido"); return false }
    return true
  }

  const validateStep2 = () => {
    if (!formData.password) { setErrorMsg("Por favor ingresa una contraseña"); return false }
    if (formData.password.length < 6) { setErrorMsg("La contraseña debe tener al menos 6 caracteres"); return false }
    if (formData.password !== formData.confirmPassword) { setErrorMsg("Las contraseñas no coinciden"); return false }
    return true
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) { setErrorMsg(""); setStep(2) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return
    setIsLoading(true)
    try {
      const { confirmPassword, ...userData } = formData
      await register({ ...userData, rol_id: 3 }) // Siempre consumidor
    } catch (error) {
      setErrorMsg(error.response?.data?.error || "Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex justify-between items-center px-6 py-3 text-white text-sm font-medium">
        <span>NaturaPiscis</span>
      </div>

      <div className="flex-1 px-6 py-8">
        <motion.div className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          <div className="text-center mb-12">
            <motion.div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Fish size={32} className="text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-3">NaturaPiscis</h1>
            <p className="text-slate-400 text-lg">Únete a nuestra comunidad acuática</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <span className="text-blue-300 text-sm font-medium">Registro de Consumidor</span>
            </div>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-2xl mb-6 text-sm"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" className="space-y-6"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                  <div>
                    <label className="block text-white font-medium mb-3">Nombre Completo *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={20} className="text-slate-400" />
                      </div>
                      <input name="nombre" type="text" required value={formData.nombre} onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu nombre completo" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Correo Electrónico *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={20} className="text-slate-400" />
                      </div>
                      <input name="email" type="email" required value={formData.email} onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="correo@ejemplo.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Teléfono (opcional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={20} className="text-slate-400" />
                      </div>
                      <input name="telefono" type="tel" value={formData.telefono} onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu número de teléfono" />
                    </div>
                  </div>

                  <motion.button type="button" onClick={nextStep}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <span>Continuar</span><ArrowRight size={20} />
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" className="space-y-6"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

                  <div>
                    <label className="block text-white font-medium mb-3">Contraseña *</label>
                    <div className="relative">
                      <input name="password" type={showPassword ? "text" : "password"} required
                        value={formData.password} onChange={handleChange}
                        className="w-full pl-4 pr-12 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Mínimo 6 caracteres</p>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Confirmar Contraseña *</label>
                    <input name="confirmPassword" type={showPassword ? "text" : "password"} required
                      value={formData.confirmPassword} onChange={handleChange}
                      className="w-full pl-4 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••" />
                  </div>

                  <div className="flex items-start gap-3">
                    <input id="terms" type="checkbox" required
                      className="mt-1 h-4 w-4 text-blue-500 border-slate-600 rounded bg-slate-700" />
                    <label htmlFor="terms" className="text-sm text-slate-300">
                      Acepto los <Link to="/terminos" className="text-blue-400 hover:text-blue-300 underline">Términos y Condiciones</Link>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <motion.button type="button" onClick={() => { setStep(1); setErrorMsg("") }}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <ArrowLeft size={20} /><span>Atrás</span>
                    </motion.button>
                    <motion.button type="submit" disabled={isLoading}
                      className={`flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}>
                      {isLoading
                        ? <><motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /><span>Registrando...</span></>
                        : <span>Registrarse</span>}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Separador */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm">o regístrate con</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Google */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setErrorMsg("")
                const result = await loginWithGoogle(credentialResponse.credential)
                if (result.success) {
                  navigate("/dashboard-consumidor")
                } else {
                  setErrorMsg(result.error || "Error con Google")
                }
              }}
              onError={() => setErrorMsg("Error al registrarse con Google")}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="signup_with"
              locale="es"
            />
          </div>

          <div className="text-center">
            <p className="text-slate-400">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Inicia sesión</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Registro