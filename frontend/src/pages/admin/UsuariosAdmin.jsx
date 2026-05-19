import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, UserX, UserCheck, Shield, ShoppingBag, Fish, AlertCircle, Edit2, Eye, EyeOff, X, Save, Trash2 } from "lucide-react"
import axiosInstance from "../../api/config/axios"

const rolColor = { 1: "bg-purple-100 text-purple-700", 2: "bg-cyan-100 text-cyan-700", 3: "bg-blue-100 text-blue-700" }
const rolNombre = { 1: "Admin", 2: "Productor", 3: "Consumidor" }
const rolIcon = { 1: Shield, 2: Fish, 3: ShoppingBag }

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroRol, setFiltroRol] = useState("todos")
  const [confirmBaja, setConfirmBaja] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [editUsuario, setEditUsuario] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { fetchUsuarios() }, [])

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get("/usuarios/admin/todos")
      const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setUsuarios(data)
    } catch (err) {
      console.error("Error cargando usuarios:", err)
    } finally {
      setLoading(false)
    }
  }

  const notify = (msg, type = "success") => {
    if (type === "success") setSuccess(msg)
    else setError(msg)
    setTimeout(() => { setSuccess(null); setError(null) }, 3000)
  }

  const handleToggleBaja = async (usuario) => {
    try {
      await axiosInstance.patch(`/usuarios/admin/${usuario.id}/estado`, { activo: !usuario.activo })
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: !u.activo } : u))
      notify(usuario.activo ? `${usuario.nombre} dado de baja` : `${usuario.nombre} reactivado`)
      setConfirmBaja(null)
    } catch (err) {
      notify(err.response?.data?.message || "Error al cambiar estado", "error")
    }
  }

  const handleEliminar = async (usuario) => {
    try {
      await axiosInstance.delete(`/usuarios/admin/${usuario.id}`)
      setUsuarios(prev => prev.filter(u => u.id !== usuario.id))
      notify(`Usuario "${usuario.nombre}" eliminado correctamente`)
      setConfirmEliminar(null)
    } catch (err) {
      notify(err.response?.data?.message || "Error al eliminar usuario", "error")
    }
  }

  const openEdit = (usuario) => {
    setEditUsuario(usuario)
    setEditForm({
      nombre: usuario.nombre || "",
      email: usuario.email || "",
      telefono: usuario.telefono || "",
      rol_id: usuario.rol_id || 3,
      password: "",
    })
    setShowPass(false)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      const payload = {
        nombre: editForm.nombre,
        email: editForm.email,
        telefono: editForm.telefono,
        rol_id: parseInt(editForm.rol_id),
      }
      if (editForm.password) {
        if (editForm.password.length < 6) { notify("La contraseña debe tener al menos 6 caracteres", "error"); setEditLoading(false); return }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(editForm.password)) { notify("La contraseña debe tener mayúscula, minúscula y número", "error"); setEditLoading(false); return }
        payload.password = editForm.password
      }
      await axiosInstance.put(`/usuarios/admin/${editUsuario.id}`, payload)
      setUsuarios(prev => prev.map(u => u.id === editUsuario.id ? { ...u, ...payload } : u))
      notify(`Usuario "${editForm.nombre}" actualizado correctamente`)
      setEditUsuario(null)
    } catch (err) {
      notify(err.response?.data?.message || "Error al actualizar usuario", "error")
    } finally {
      setEditLoading(false)
    }
  }

  const filtered = usuarios.filter(u => {
    const matchSearch = u.nombre?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRol = filtroRol === "todos" || u.rol_id === parseInt(filtroRol)
    return matchSearch && matchRol
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
          <p className="text-gray-500 text-sm">{usuarios.length} usuarios registrados</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="bg-white border border-gray-300 text-gray-800 text-sm rounded-xl pl-9 pr-4 py-2.5 w-72 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400" />
        </div>
      </div>

      {/* Alertas */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">✓ {success}</motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[["todos", "Todos"], ["1", "Admin"], ["2", "Productores"], ["3", "Consumidores"]].map(([val, label]) => (
          <button key={val} onClick={() => setFiltroRol(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${filtroRol === val ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Usuario</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Email</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rol</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Estado</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No se encontraron usuarios</td></tr>
            ) : filtered.map((u, i) => {
              const iniciales = u.nombre?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "U"
              const Icon = rolIcon[u.rol_id] || Shield
              return (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`hover:bg-gray-50 transition-colors ${!u.activo ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0
                        ${u.rol_id === 1 ? "bg-gradient-to-br from-purple-500 to-purple-600"
                          : u.rol_id === 2 ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                          : "bg-gradient-to-br from-blue-400 to-blue-500"}`}>
                        {iniciales}
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm font-medium">{u.nombre}</p>
                        {u.nombre_empresa && <p className="text-gray-400 text-xs">{u.nombre_empresa}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-gray-500 text-sm">{u.email}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${rolColor[u.rol_id] || "bg-gray-100 text-gray-500"}`}>
                      <Icon size={11} />{rolNombre[u.rol_id] || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {/* Editar */}
                      <button onClick={() => openEdit(u)} title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      {/* Dar de baja / reactivar — solo no admins */}
                      {u.rol_id !== 1 && (
                        <button onClick={() => setConfirmBaja(u)}
                          title={u.activo ? "Dar de baja" : "Reactivar"}
                          className={`p-1.5 rounded-lg transition-colors ${u.activo
                            ? "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}>
                          {u.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      )}
                      {/* Eliminar — solo no admins */}
                      {u.rol_id !== 1 && (
                        <button onClick={() => setConfirmEliminar(u)} title="Eliminar usuario"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Editar */}
      {editUsuario && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setEditUsuario(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 font-bold text-lg">Editar Usuario</h3>
              <button onClick={() => setEditUsuario(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input type="text" value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} required
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                <input type="text" value={editForm.telefono} onChange={e => setEditForm({...editForm, telefono: e.target.value})}
                  placeholder="Opcional"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {editUsuario.rol_id !== 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                  <select value={editForm.rol_id} onChange={e => setEditForm({...editForm, rol_id: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="2">Productor</option>
                    <option value="3">Consumidor</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
                </label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={editForm.password}
                    onChange={e => setEditForm({...editForm, password: e.target.value})}
                    placeholder="Nueva contraseña..."
                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {editForm.password && (
                  <p className="text-xs text-gray-400 mt-1">Debe tener mayúscula, minúscula y número (ej: Admin123)</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUsuario(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={editLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium">
                  {editLoading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                    : <><Save size={14} />Guardar cambios</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Modal confirmar baja */}
      {confirmBaja && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmBaja(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmBaja.activo ? "bg-orange-50" : "bg-green-50"}`}>
                <AlertCircle size={20} className={confirmBaja.activo ? "text-orange-500" : "text-green-600"} />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">{confirmBaja.activo ? "Dar de baja usuario" : "Reactivar usuario"}</h3>
                <p className="text-gray-400 text-sm">Esta acción puede revertirse</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-5">
              {confirmBaja.activo
                ? <>¿Dar de baja a <span className="font-medium text-gray-900">"{confirmBaja.nombre}"</span>? No podrá iniciar sesión.</>
                : <>¿Reactivar a <span className="font-medium text-gray-900">"{confirmBaja.nombre}"</span>? Podrá iniciar sesión nuevamente.</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBaja(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium">Cancelar</button>
              <button onClick={() => handleToggleBaja(confirmBaja)}
                className={`flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium ${confirmBaja.activo ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"}`}>
                {confirmBaja.activo ? "Dar de baja" : "Reactivar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmEliminar(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Eliminar usuario</h3>
                <p className="text-gray-400 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-5">
              ¿Eliminar permanentemente a <span className="font-medium text-gray-900">"{confirmEliminar.nombre}"</span>? Se perderán todos sus datos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium">Cancelar</button>
              <button onClick={() => handleEliminar(confirmEliminar)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium">
                Eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default UsuariosAdmin