"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"

const PedidoConsumidor = ({ pedido }) => {
  const [expanded, setExpanded] = useState(false)

  const { id, fecha, productos, total, estado, direccionEnvio, metodoPago, fechaEntregaEstimada, numeroSeguimiento } =
    pedido

  // Función para determinar el icono y color según el estado
  const getStatusInfo = () => {
    switch (estado) {
      case "pendiente":
        return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-100" }
      case "procesando":
        return { icon: Package, color: "text-green-500", bg: "bg-green-100" }
      case "enviado":
        return { icon: Truck, color: "text-purple-500", bg: "bg-purple-100" }
      case "entregado":
        return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" }
      case "cancelado":
        return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100" }
      default:
        return { icon: Clock, color: "text-gray-500", bg: "bg-gray-100" }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cabecera del pedido */}
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color} mr-3`}>
            <StatusIcon size={20} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Pedido #{id}</h3>
            <p className="text-sm text-gray-500">{formatDate(fecha)}</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="text-right mr-4">
            <span className="font-bold text-gray-800">${total.toFixed(2)}</span>
            <p className={`text-sm capitalize ${statusInfo.color}`}>{estado}</p>
          </div>

          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Detalles del pedido (expandible) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100"
          >
            {/* Productos */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-medium text-gray-700 mb-2">Productos</h4>
              <div className="space-y-2">
                {productos.map((producto) => (
                  <div key={producto.id} className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-green-50 overflow-hidden mr-2">
                        <img
                          src={producto.imagen || "/placeholder.svg?height=40&width=40"}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-gray-800">
                        {producto.nombre} <span className="text-gray-500">x{producto.cantidad}</span>
                      </span>
                    </div>
                    <span className="font-medium">${(producto.precio * producto.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Información de envío y pago */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Información de envío</h4>
                <p className="text-sm text-gray-600">{direccionEnvio}</p>
                {fechaEntregaEstimada && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Entrega estimada:</span> {formatDate(fechaEntregaEstimada)}
                  </p>
                )}
                {numeroSeguimiento && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Número de seguimiento:</span> {numeroSeguimiento}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Método de pago</h4>
                <p className="text-sm text-gray-600">{metodoPago.tipo}</p>
                {metodoPago.ultimosDigitos && (
                  <p className="text-sm text-gray-600">Tarjeta terminada en {metodoPago.ultimosDigitos}</p>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="p-4 bg-gray-50 flex justify-end space-x-3">
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Ver detalles
              </button>

              {estado === "pendiente" && (
                <button className="px-4 py-2 text-sm bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors">
                  Cancelar pedido
                </button>
              )}

              {estado === "enviado" && (
                <button className="px-4 py-2 text-sm bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors">
                  Seguir envío
                </button>
              )}

              {estado === "entregado" && (
                <button className="px-4 py-2 text-sm bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors">
                  Valorar productos
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PedidoConsumidor