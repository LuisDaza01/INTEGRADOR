import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const ProgressRing = ({ title, percentage, color = '#8b5cf6', subtitle, showPercentage = true }) => {
  const { D, isDark } = useTheme();
  const radius = 50;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const card = isDark ? 'rgba(255,255,255,0.03)' : D.surface;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-xl p-5 flex flex-col items-center justify-center"
      style={{ background: card, border: `1px solid ${D.border}` }}
    >
      <h3 className="text-sm font-semibold mb-4 text-center" style={{ color: D.text }}>{title}</h3>

      <div className="relative w-32 h-32 mb-3">
        <svg width={140} height={140} className="transform -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke={D.border} strokeWidth="8" />
          <motion.circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{Math.round(percentage)}%</span>
          </div>
        )}
      </div>

      {subtitle && <p className="text-xs text-center" style={{ color: D.muted }}>{subtitle}</p>}
    </motion.div>
  );
};

export default ProgressRing;
