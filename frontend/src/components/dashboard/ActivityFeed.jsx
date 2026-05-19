import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const ActivityFeed = ({ title, activities, maxItems = 5 }) => {
  const { D, isDark } = useTheme();
  const displayActivities = activities?.slice(0, maxItems) || [];

  const getConfig = (type) => {
    const configs = {
      order:   { glow: D.primary, icon: '📦' },
      sale:    { glow: D.green,   icon: '💰' },
      alert:   { glow: D.red,     icon: '⚠️' },
      info:    { glow: D.muted,   icon: 'ℹ️' },
      success: { glow: D.green,   icon: '✅' },
    };
    return configs[type] || configs.info;
  };

  const card = isDark ? 'rgba(255,255,255,0.03)' : D.surface;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl p-5"
      style={{ background: card, border: `1px solid ${D.border}` }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: D.text }}>{title}</h3>

      {displayActivities.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: D.muted }}>No hay actividad reciente</p>
      ) : (
        <div className="space-y-3">
          {displayActivities.map((activity, index) => {
            const cfg = getConfig(activity.type);
            return (
              <motion.div key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 pb-3"
                style={{ borderBottom: `1px solid ${D.border}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: `${cfg.glow}15`, border: `1px solid ${cfg.glow}25` }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: D.text }}>{activity.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: D.muted }}>{activity.description}</p>
                  {activity.timestamp && (
                    <p className="text-xs mt-0.5" style={{ color: D.muted }}>{activity.timestamp}</p>
                  )}
                </div>
                {activity.badge && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${D.green}18`, color: D.green, border: `1px solid ${D.green}35` }}>
                    {activity.badge}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
