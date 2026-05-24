// components/CartItem.jsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, Package } from "lucide-react";

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || isUpdating) return;
    
    try {
      setIsUpdating(true);
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    
    try {
      setIsRemoving(true);
      await onRemove(item.id);
    } catch (error) {
      console.error("Error al eliminar item:", error);
      setIsRemoving(false);
    }
  };

  const subtotal = (parseFloat(item.precio) * item.cantidad).toFixed(2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-4">
        {/* Imagen del producto */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {item.imagen ? (
            <img
              src={item.imagen}
              alt={item.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/api/placeholder/80/80";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-green-50">
              <Package size={24} className="text-green-400" />
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{item.nombre}</h3>
          <p className="text-green-600 font-bold text-lg">Bs{parseFloat(item.precio).toFixed(2)}</p>
          
          {/* Controles de cantidad */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => handleQuantityChange(item.cantidad - 1)}
                disabled={isUpdating || item.cantidad <= 1}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} />
              </button>
              
              <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                {isUpdating ? "..." : item.cantidad}
              </span>
              
              <button
                onClick={() => handleQuantityChange(item.cantidad + 1)}
                disabled={isUpdating}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Subtotal y botón eliminar */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-800">Bs{subtotal}</span>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Eliminar del carrito"
              >
                {isRemoving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de carga */}
      {(isUpdating || isRemoving) && (
        <div className="mt-3 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500"></div>
            {isUpdating ? "Actualizando..." : "Eliminando..."}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CartItem;