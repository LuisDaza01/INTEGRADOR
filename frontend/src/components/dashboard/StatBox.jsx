import React from 'react';
import { motion } from 'framer-motion';

const StatBox = ({ 
  label, 
  value, 
  unit = '',
  icon: Icon,
  backgroundColor = 'bg-gradient-to-br from-blue-400 to-blue-600',
  textColor = 'text-white'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className={`${backgroundColor} rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-opacity-80 text-sm font-medium">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold">{value}</h3>
            {unit && <span className="text-lg opacity-75">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className="text-white opacity-50 text-5xl">
            <Icon size={48} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatBox;
