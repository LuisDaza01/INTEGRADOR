import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const TrendChart = ({
  title, data, dataKey = 'value', type = 'line',
  color, height = 300, showLegend = false, xAxisDataKey = 'name'
}) => {
  const { D, isDark } = useTheme();
  const chartColor = color ?? D.primary;
  const card = isDark ? 'rgba(255,255,255,0.03)' : D.surface;

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: `1px solid ${D.border}`,
      borderRadius: '10px',
      color: D.text,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
    labelStyle: { color: D.sub, fontSize: 12 },
    itemStyle: { color: chartColor },
  };

  const axisProps = { stroke: D.dim, fontSize: 11 };
  const gridProps = { strokeDasharray: '3 3', stroke: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(14,116,193,0.1)' };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xAxisDataKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            {showLegend && <Legend />}
            <Area type="monotone" dataKey={dataKey} stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${dataKey})`} />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xAxisDataKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={chartColor} radius={[6, 6, 0, 0]} opacity={0.85} />
          </BarChart>
        );
      default:
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xAxisDataKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey={dataKey} stroke={chartColor} strokeWidth={2.5}
              dot={{ fill: chartColor, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: chartColor, stroke: isDark ? '#0f172a' : '#fff', strokeWidth: 2 }} />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-xl p-5"
      style={{ background: card, border: `1px solid ${D.border}` }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: D.text }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
};

export default TrendChart;
