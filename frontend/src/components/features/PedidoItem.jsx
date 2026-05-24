"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Package,
  Truck,
  Calendar,
  DollarSign,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"

const PedidoItem = ({ pedido, onConfirmar }) => {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  // ✅ ESTADOS CORREGIDOS - Exactamente como los espera la API
  const ESTADOS_VALIDOS = [
    "pendiente", 
    "confirmado", 
    "en preparación", 
    "en camino", 
    "entregado",  // ⭐ MINÚSCULA, no "Entregado"
    "cancelado"
  ]

  // ✅ FUNCIÓN CORREGIDA para manejar confirmación con validación
  const handleConfirmar = async (pedidoId, nuevoEstado) => {
    // Validaciones previas
    if (!pedidoId) {
      console.error("❌ ID de pedido no válido:", pedidoId)
      setError("ID de pedido no válido")
      return
    }

    // ⭐ VALIDAR que el estado sea válido
    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
      console.error("❌ Estado no válido:", nuevoEstado, "Estados válidos:", ESTADOS_VALIDOS)
      setError(`Estado "${nuevoEstado}" no es válido`)
      return
    }

    if (pedido.estado?.toLowerCase() === nuevoEstado) {
      console.log("ℹ️ El pedido ya está en este estado")
      return
    }

    setUpdating(true)
    setError(null)

    try {
      console.log(`🔄 Actualizando pedido ${pedidoId}: ${pedido.estado} -> ${nuevoEstado}`)
      
      // ⭐ AQUÍ ESTÁ LA LÍNEA 313 QUE CAUSABA EL ERROR
      // Llamar a la función del padre con los parámetros correctos
      await onConfirmar(pedidoId, nuevoEstado)
      
      console.log(`✅ Pedido ${pedidoId} actualizado exitosamente`)
      
    } catch (error) {
      console.error("❌ Error al actualizar pedido:", error)
      setError("Error al actualizar el pedido. Intenta nuevamente.")
    } finally {
      setUpdating(false)
    }
  }

  // Determinar el color del estado - CORREGIDO para manejar minúsculas
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "en preparación":
        return "bg-purple-100 text-purple-800"
      case "en camino":
        return "bg-indigo-100 text-indigo-800"
      case "entregado":
        return "bg-green-100 text-green-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Determinar el ícono del estado - CORREGIDO para manejar minúsculas
  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case "pendiente":
        return Clock
      case "confirmado":
        return CheckCircle
      case "en preparación":
        return Package
      case "en camino":
        return Truck
      case "entregado":
        return CheckCircle
      case "cancelado":
        return XCircle
      default:
        return AlertCircle
    }
  }

  const StatusIcon = getStatusIcon(pedido.estado)
  const estado = pedido.estado?.toLowerCase()

  // ✅ Formatear estado para mostrar (primera letra mayúscula)
  const formatearEstado = (estado) => {
    if (!estado) return "Desconocido"
    return estado.charAt(0).toUpperCase() + estado.slice(1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4"
    >
      {/* ✅ Banner de error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-50 border-b border-red-200 p-3"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* ✅ Indicador de carga */}
      {updating && (
        <div className="bg-green-50 border-b border-green-200 p-2">
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full mr-2"
            />
            <span className="text-sm text-green-700">Actualizando pedido...</span>
          </div>
        </div>
      )}

      {/* Cabecera del pedido */}
      <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pedido #{pedido.numero}</h3>
              <p className="text-sm text-gray-500">
                {pedido.fecha} • {pedido.items?.length || 0} productos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.estado)}`}>
              <div className="flex items-center">
                <StatusIcon className="h-4 w-4 mr-1" />
                {formatearEstado(pedido.estado)}
              </div>
            </div>
            <span className="text-lg font-bold text-gray-900">${pedido.total?.toFixed(2) || '0.00'}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </motion.div>
          </div>
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
            className="border-t border-gray-200"
          >
            <div className="p-4 bg-gray-50">
              {/* Información del cliente */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Información del cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">{pedido.cliente?.nombre || 'Cliente desconocido'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">{pedido.cliente?.direccion || 'Dirección no disponible'}</span>
                  </div>
                </div>
              </div>

              {/* Productos del pedido */}
              {pedido.items && pedido.items.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Productos</h4>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pedido.items.map((item, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img
                                    className="h-10 w-10 rounded-md object-cover"
                                    src={item.imagen || "/placeholder.svg"}
                                    alt={item.nombre}
                                  />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                                  <div className="text-xs text-gray-500">{item.tipo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className="px-2 py-1 text-sm bg-gray-100 rounded-md">{item.cantidad} kg</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                              Bs{item.precio?.toFixed(2) || '0.00'}/kg
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                              Bs{((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">No hay información de productos disponible</p>
                </div>
              )}

              {/* Resumen del pedido */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fechas */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 text-green-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Fechas</h4>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span>Pedido:</span>
                      <span>{pedido.fecha || 'No disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrega estimada:</span>
                      <span>{pedido.fechaEntrega || 'No disponible'}</span>
                    </div>
                  </div>
                </div>

                {/* Envío */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <Truck className="h-4 w-4 text-green-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Envío</h4>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span>Método:</span>
                      <span>{pedido.envio?.metodo || 'No disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Costo:</span>
                      <span>Bs{pedido.envio?.costo?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Pago */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <DollarSign className="h-4 w-4 text-green-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Pago</h4>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span>Método:</span>
                      <span>{pedido.pago?.metodo || 'No disponible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className={pedido.pago?.estado === "Pagado" ? "text-green-600" : "text-yellow-600"}>
                        {pedido.pago?.estado || 'No disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ ACCIONES CORREGIDAS - Los estados ahora coinciden con la API */}
              <div className="mt-4 flex justify-end space-x-3">
                {estado === "pendiente" && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleConfirmar(pedido.id, "cancelado")}
                      disabled={updating}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4 inline mr-1" />
                      Rechazar pedido
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleConfirmar(pedido.id, "confirmado")}
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Aceptar pedido
                    </motion.button>
                  </>
                )}

                {estado === "confirmado" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleConfirmar(pedido.id, "en preparación")}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <Package className="h-4 w-4 inline mr-1" />
                    Marcar en preparación
                  </motion.button>
                )}

                {estado === "en preparación" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleConfirmar(pedido.id, "en camino")}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4 inline mr-1" />
                    Marcar en camino
                  </motion.button>
                )}

                {/* ⭐ LÍNEA 313 CORREGIDA - Era "Entregado" y debía ser "entregado" */}
                {estado === "en camino" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleConfirmar(pedido.id, "entregado")} // ✅ CORREGIDO: minúscula
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Marcar como entregado
                  </motion.button>
                )}

                {/* Debug info en desarrollo */}
                {import.meta.env.MODE === 'development' && (
                  <div className="text-xs text-gray-500 mt-2">
                    Estado actual: "{estado}" | ID: {pedido.id}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PedidoItem