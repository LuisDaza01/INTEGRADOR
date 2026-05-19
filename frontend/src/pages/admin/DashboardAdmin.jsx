import { useState } from "react"
import { motion } from "framer-motion"
import { Outlet, useLocation } from "react-router-dom"
import { Bell, Fish, Shield } from "lucide-react"
import SidebarAdmin from "../../components/layout/SidebarAdmin"
import { useAuth } from "../../contexts/AuthContext"

const DashboardAdmin = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [notiOpen, setNotiOpen] = useState(false)

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "A"
  const nombreCorto = user?.nombre?.split(" ")[0] || "Admin"

  const sectionTitles = {
    "/dashboard-admin":            "Estadísticas Globales",
    "/dashboard-admin/productos":  "Gestión de Productos",
    "/dashboard-admin/pedidos":    "Gestión de Pedidos",
    "/dashboard-admin/categorias": "Gestión de Categorías",
    "/dashboard-admin/usuarios": "Gestión de Usuarios",
    "/dashboard-admin/registrar-productor": "Registrar Usuario",
  }
  const currentTitle = sectionTitles[location.pathname] || "Admin Panel"

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarAdmin />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Logo */}
            <div className="flex items-center">
              <motion.div whileHover={{ rotate: 15 }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-lg mr-2">
                <Fish className="h-6 w-6 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-gray-800">NaturaPiscis</h1>
            </div>

            {/* Título sección */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <span className="text-gray-700 font-medium text-sm">{currentTitle}</span>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              {/* Badge admin */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                <Shield size={12} className="text-blue-500" />
                <span className="text-blue-600 text-xs font-medium">Administrador</span>
              </div>

              {/* Notificaciones */}
              <div className="relative">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setNotiOpen(!notiOpen)}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500" />
                </motion.button>
                {notiOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-700 text-sm">Notificaciones</h3>
                    </div>
                    <div className="p-4 text-center text-gray-400 text-sm py-8">
                      No hay notificaciones nuevas
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-800">{nombreCorto}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow">
                  {iniciales}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardAdmin