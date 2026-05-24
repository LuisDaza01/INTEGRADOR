"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Calendar, Clock, ShoppingBag, Utensils, Check } from "lucide-react"

const ReservaForm = ({ productor, producto, onClose }) => {
  const [formData, setFormData] = useState({
    producto_id: producto ? producto.id : "",
    cantidad: 1,
    fecha: "",
    hora: "",
    es_cocinado: !producto,
    notas: "",
  })
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Obtener productos del productor si no se seleccionó uno específico
  useEffect(() => {
    if (!producto && productor) {
      // Aquí iría la llamada a la API para obtener los productos
      // Por ahora usamos datos de ejemplo
      setProductos([
        { id: 1, nombre: "Trucha Arcoíris", precio: 8.99 },
        { id: 2, nombre: "Tilapia Fresca", precio: 7.5 },
        { id: 3, nombre: "Salmón Orgánico", precio: 12.99 },
      ])
    }
  }, [productor, producto])

  // Obtener fechas disponibles (próximos 14 días)
  const getFechasDisponibles = () => {
    const fechas = []
    const hoy = new Date()

    for (let i = 1; i <= 14; i++) {
      const fecha = new Date(hoy)
      fecha.setDate(hoy.getDate() + i)

      // Verificar si el día de la semana está en los días de venta del productor
      const diaSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][fecha.getDay()]

      // Si no hay días de venta definidos, mostrar todos los días
      // O si hay días de venta, verificar si este día está disponible
      const disponible =
        !productor.dias_venta ||
        productor.dias_venta.some(
          (d) => d.dia.toLowerCase() === diaSemana && (formData.es_cocinado ? d.venta_cocinado : d.venta_directa),
        )

      if (disponible) {
        fechas.push({
          fecha: fecha.toISOString().split("T")[0],
          diaSemana,
        })
      }
    }

    return fechas
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Aquí iría la llamada a la API para crear la reserva
      console.log("Enviando reserva:", formData)

      // Simulamos una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError("Error al procesar la reserva. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const fechasDisponibles = getFechasDisponibles()

  return (
    <div className="p-6">
      {success ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">¡Reserva realizada con éxito!</h3>
          <p className="text-gray-600 mb-6">
            Tu reserva ha sido enviada al productor. Recibirás una confirmación pronto.
          </p>
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </motion.div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {formData.es_cocinado ? "Reservar comida cocinada" : "Reservar productos"}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tipo de reserva */}
              {!producto && (
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Tipo de reserva</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`
                      flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer
                      ${formData.es_cocinado ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}
                    `}
                    >
                      <input
                        type="radio"
                        name="es_cocinado"
                        checked={formData.es_cocinado}
                        onChange={() => setFormData({ ...formData, es_cocinado: true, producto_id: "" })}
                        className="sr-only"
                      />
                      <Utensils
                        size={18}
                        className={`mr-2 ${formData.es_cocinado ? "text-orange-500" : "text-gray-500"}`}
                      />
                      <span className={formData.es_cocinado ? "text-orange-800" : "text-gray-700"}>
                        Comida cocinada
                      </span>
                    </label>
                    <label
                      className={`
                      flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer
                      ${!formData.es_cocinado ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}
                    `}
                    >
                      <input
                        type="radio"
                        name="es_cocinado"
                        checked={!formData.es_cocinado}
                        onChange={() => setFormData({ ...formData, es_cocinado: false })}
                        className="sr-only"
                      />
                      <ShoppingBag
                        size={18}
                        className={`mr-2 ${!formData.es_cocinado ? "text-green-500" : "text-gray-500"}`}
                      />
                      <span className={!formData.es_cocinado ? "text-green-800" : "text-gray-700"}>
                        Productos frescos
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Producto */}
              {!formData.es_cocinado && (
                <div>
                  <label htmlFor="producto_id" className="block text-gray-700 font-medium mb-2">
                    Producto a reservar
                  </label>
                  <select
                    id="producto_id"
                    name="producto_id"
                    value={formData.producto_id}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!formData.es_cocinado}
                  >
                    <option value="">Selecciona un producto</option>
                    {producto ? (
                      <option value={producto.id}>
                        {producto.nombre} - ${producto.precio}
                      </option>
                    ) : (
                      productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - ${p.precio}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Cantidad */}
              <div>
                <label htmlFor="cantidad" className="block text-gray-700 font-medium mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  min="1"
                  value={formData.cantidad}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Fecha */}
              <div>
                <label htmlFor="fecha" className="block text-gray-700 font-medium mb-2">
                  Fecha de reserva
                </label>
                <div className="relative">
                  <select
                    id="fecha"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona una fecha</option>
                    {fechasDisponibles.map((f) => (
                      <option key={f.fecha} value={f.fecha}>
                        {new Date(f.fecha).toLocaleDateString()} ({f.diaSemana})
                      </option>
                    ))}
                  </select>
                  <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Hora */}
              <div>
                <label htmlFor="hora" className="block text-gray-700 font-medium mb-2">
                  Hora de recogida
                </label>
                <div className="relative">
                  <select
                    id="hora"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona una hora</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                  <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Notas adicionales */}
              <div>
                <label htmlFor="notas" className="block text-gray-700 font-medium mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    formData.es_cocinado
                      ? "Especifica qué platos te gustaría reservar..."
                      : "Alguna instrucción especial para tu pedido..."
                  }
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  formData.es_cocinado ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"
                } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? "Procesando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default ReservaForm