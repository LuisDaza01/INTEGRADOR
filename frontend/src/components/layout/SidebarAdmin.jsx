import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, Tag, LogOut,
  ChevronLeft, Menu, X, Shield, Fish, UserPlus, Users
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"

const SidebarAdmin = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "A"
  const nombreCompleto = user?.nombre || "Administrador"

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (window.innerWidth >= 768 && window.innerWidth < 1024) setIsCollapsed(true)
      else if (window.innerWidth >= 1024) setIsCollapsed(false)
      if (!mobile && isMobileOpen) setIsMobileOpen(false)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [isMobileOpen])

  useEffect(() => {
    if (isMobileOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = "unset"
    return () => { document.body.style.overflow = "unset" }
  }, [isMobileOpen])

  const menuItems = [
    { id: "estadisticas",        label: "Estadísticas",       icon: LayoutDashboard, color: "text-blue-600",   path: "/dashboard-admin" },
    { id: "productos",           label: "Productos",          icon: Package,          color: "text-green-600",  path: "/dashboard-admin/productos" },
    { id: "pedidos",             label: "Pedidos",            icon: ShoppingBag,      color: "text-orange-600", path: "/dashboard-admin/pedidos" },
    { id: "categorias",          label: "Categorías",         icon: Tag,              color: "text-cyan-600",   path: "/dashboard-admin/categorias" },
    { id: "usuarios",            label: "Usuarios",           icon: Users,            color: "text-indigo-600", path: "/dashboard-admin/usuarios" },
    { id: "registrar-productor", label: "Registrar Usuario",  icon: UserPlus,         color: "text-purple-600", path: "/dashboard-admin/registrar-productor" },
  ]

  const getCurrentTab = () => {
    const p = location.pathname
    if (p === "/dashboard-admin") return "estadisticas"
    return p.split("/").pop()
  }
  const currentTab = getCurrentTab()

  const handleNav = (item) => {
    navigate(item.path)
    if (isMobile) setIsMobileOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full min-h-screen bg-white border-r border-gray-200">

      {/* Header móvil */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-2">
            <Fish size={20} className="text-white" />
            <span className="text-white font-bold">NaturaPiscis</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="p-1 text-white hover:text-blue-100">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Header desktop */}
      {!isMobile && (
        <div className="relative flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
          {(!isCollapsed) && (
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-1.5 rounded-lg">
                <Shield size={14} className="text-white" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm leading-none">Admin Panel</p>
                <p className="text-blue-500 text-xs mt-0.5">NaturaPiscis</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-1.5 rounded-lg mx-auto">
              <Shield size={14} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow hover:border-blue-300 z-10"
          >
            <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronLeft size={12} className="text-gray-600" />
            </motion.div>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {(!isCollapsed || isMobile) && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">Menú Principal</p>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <div key={item.id} className="relative group">
              <motion.button
                onClick={() => handleNav(item)}
                whileHover={{ x: isCollapsed && !isMobile ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isCollapsed && !isMobile ? "justify-center" : "gap-3"}
                  ${isActive
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border-l-4 border-blue-500"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                <Icon size={18} className={isActive ? "text-blue-600" : item.color} />
                {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                {isActive && (!isCollapsed || isMobile) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </motion.button>
              {/* Tooltip colapsado */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className={`flex items-center mb-3 ${isCollapsed && !isMobile ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0">
            {iniciales}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{nombreCompleto}</p>
              <p className="text-xs text-blue-500">Administrador</p>
            </div>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLogoutModal(true)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-sm
            ${isCollapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut size={15} />
          {(!isCollapsed || isMobile) && <span>Cerrar sesión</span>}
        </motion.button>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <LogOut className="text-red-600" size={24} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">¿Cerrar sesión?</h3>
                <p className="text-gray-500 text-sm mb-6">Tendrás que iniciar sesión nuevamente para acceder al panel de administración.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => { logout(); setShowLogoutModal(false) }}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-xl p-3 shadow-lg md:hidden">
          <Menu size={20} className="text-gray-700" />
        </motion.button>
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={() => setIsMobileOpen(false)} />
              <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
                className="fixed left-0 top-0 bottom-0 w-72 z-50 shadow-2xl">
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex-shrink-0 min-h-screen shadow-lg"
      style={{ width: isCollapsed ? 80 : 280, minWidth: isCollapsed ? 80 : 280 }}
    >
      <SidebarContent />
    </motion.aside>
  )
}

export default SidebarAdmin