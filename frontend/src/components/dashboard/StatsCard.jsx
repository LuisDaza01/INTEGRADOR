import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const StatsCard = ({ title, value, icon: Icon, trend, trendUp = true, color = 'blue' }) => {
  const { D, isDark } = useTheme();

  const palette = {
    blue:   { glow: D.primary, accent: D.primary },
    green:  { glow: D.green,   accent: D.green   },
    purple: { glow: D.purple,  accent: D.purple  },
    orange: { glow: D.orange,  accent: D.orange  },
    red:    { glow: D.red,     accent: D.red     },
  };
  const p = palette[color] || palette.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="rounded-xl p-5"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${p.glow}12, ${p.glow}06)`
          : D.surface,
        border: `1px solid ${p.glow}30`,
        boxShadow: isDark ? `0 4px 20px rgba(0,0,0,0.3)` : `0 2px 12px ${p.glow}15`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium mb-2" style={{ color: D.muted }}>{title}</p>
          <h3 className="text-2xl font-bold" style={{ color: p.glow }}>{value}</h3>
          {trend && (
            <p className="text-xs mt-1.5 flex items-center gap-1"
              style={{ color: trendUp ? D.green : D.red }}>
              <span>{trendUp ? '↑' : '↓'}</span>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-xl"
            style={{ background: `${p.glow}18`, border: `1px solid ${p.glow}30` }}>
            <Icon size={28} style={{ color: p.accent }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
