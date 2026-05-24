import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, Plus, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react"
import axios from "../../api/config/axios"

const CategoriasAdmin = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { fetchCategorias() }, [])

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      const res = await axios.get("/categorias")
      const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setCategorias(data)
    } catch (err) { if (import.meta.env.DEV) console.warn(err?.message) }
    finally { setLoading(false) }
  }

  const notify = (msg, type = "success") => {
    if (type === "success") setSuccess(msg)
    else setError(msg)
    setTimeout(() => { setSuccess(null); setError(null) }, 3000)
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await axios.post("/categorias", { nombre: newName.trim(), descripcion: newDesc.trim() })
      setNewName(""); setNewDesc(""); setAdding(false)
      fetchCategorias()
      notify("Categoría creada correctamente")
    } catch (err) { notify(err.response?.data?.message || "Error al crear", "error") }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    try {
      await axios.put(`/categorias/${id}`, { nombre: editName.trim() })
      setEditId(null)
      fetchCategorias()
      notify("Categoría actualizada")
    } catch (err) { notify("Error al actualizar", "error") }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/categorias/${id}`)
      setCategorias(prev => prev.filter(c => c.id !== id))
      setConfirmDelete(null)
      notify("Categoría eliminada")
    } catch (err) { notify(err.response?.data?.message || "Error al eliminar", "error") }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categorías</h2>
          <p className="text-gray-500 text-sm">{categorias.length} categorías registradas</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          Nueva categoría
        </motion.button>
      </div>

      {/* Mensajes */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            ✓ {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form nueva */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-green-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-gray-800 font-semibold text-sm">Nueva categoría</p>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 placeholder-gray-400" />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 placeholder-gray-400" />
            <div className="flex gap-2">
              <button onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
                <Check size={14} /> Guardar
              </button>
              <button onClick={() => { setAdding(false); setNewName(""); setNewDesc("") }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categorias.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow group">
            {editId === cat.id ? (
              <div className="flex items-center gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                  className="flex-1 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500" />
                <button onClick={() => handleEdit(cat.id)}
                  className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditId(null)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Tag size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 text-sm font-semibold">{cat.nombre}</p>
                    {cat.descripcion && <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[140px]">{cat.descripcion}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditId(cat.id); setEditName(cat.nombre) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => setConfirmDelete(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal eliminar */}
      {confirmDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Eliminar categoría</h3>
                <p className="text-gray-400 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-5">¿Eliminar <span className="text-gray-900 font-medium">"{confirmDelete.nombre}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Eliminar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default CategoriasAdmin