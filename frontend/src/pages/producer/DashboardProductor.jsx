// ============================================
// Dashboard Productor
// Panel principal del productor
// ============================================

import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Fish,
  Menu,
  Thermometer,
  AlertTriangle,
  Eye,
  Waves,
  Power,
  Zap,
  TrendingUp,
  TrendingDown,
  Droplets,
  CheckCircle,
  Clock,
  ShoppingBag,
  Sun,
  Moon,
  Package,
  ChevronRight,
} from 'lucide-react';

// Components
import SidebarProductor from '../../components/layout/SidebarProductor';
import SensorCard from '../../components/features/SensorCard';
import ParticleBackground from '../../components/effects/ParticleBackground';
import GlitchText from '../../components/effects/GlitchText';

// Services
import { useSensorData, TAMBAQUI_INFO } from '../../api/services/sensor.service';
import api from '../../api/config/axios';
import { useTheme } from '../../contexts/ThemeContext';
import useCountUp from '../../hooks/useCountUp';

// ============================================
// SUB-COMPONENTES INLINE
// ============================================

// KPI Card con tendencia
const StatsCard = ({ title, value, unit, icon: Icon, trend, trendUp, color }) => {
  const { D } = useTheme();
  const palette = {
    green:  { glow: '#4ade80', accent: '#22C55E' },
    blue:   { glow: '#22C55E', accent: '#22C55E' },
    purple: { glow: '#c084fc', accent: '#a855f7' },
    orange: { glow: '#fb923c', accent: '#f97316' },
  };
  const p = palette[color] || palette.green;
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, ''))
  const animated = useCountUp(isNaN(numVal) ? 0 : numVal, { duration: 1400, decimals: 0 })
  const displayVal = isNaN(numVal) ? value : animated

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="np-hover rounded-xl p-5"
      style={{
        background: `linear-gradient(135deg, ${p.glow}12, ${p.glow}06)`,
        border: `1px solid ${p.glow}25`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${p.glow}15`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{ background: `${p.glow}18`, border: `1px solid ${p.glow}30` }}>
          <Icon className="h-5 w-5" style={{ color: p.accent }} />
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: `${p.glow}15`, color: p.glow }}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: D.muted }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color: p.glow }}>
        {displayVal}
        {unit ? <span className="text-base font-medium ml-1" style={{ color: D.muted }}>{unit}</span> : null}
      </p>
    </motion.div>
  );
};

// Feed de actividad reciente
const ActivityFeed = ({ activities = [] }) => {
  const { D, isDark } = useTheme();
  const typeIcons = {
    order:   <ShoppingBag size={14} style={{ color: '#22C55E' }} />,
    alert:   <AlertTriangle size={14} style={{ color: '#f87171' }} />,
    success: <CheckCircle size={14} style={{ color: '#4ade80' }} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="np-hover rounded-xl p-6 relative overflow-hidden"
      style={{
        background: isDark ? 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(9,15,30,0.99))' : D.surface,
        border: `1px solid ${isDark ? 'rgba(34,197,94,0.1)' : D.border}`,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)' }} />
      <h4 className="font-semibold mb-4 flex items-center gap-2" style={{ color: D.text }}>
        <Clock className="h-5 w-5" style={{ color: '#22C55E' }} />
        Actividad Reciente
      </h4>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: a.type === 'alert' ? 'rgba(239,68,68,0.15)' : a.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.15)' }}>
              {typeIcons[a.type] || typeIcons.order}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: D.text }}>{a.title}</p>
              <p className="text-xs truncate" style={{ color: D.muted }}>{a.description}</p>
              <p className="text-xs mt-0.5" style={{ color: D.dim }}>{a.timestamp}</p>
            </div>
            {a.badge && (
              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                {a.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Anillo de progreso SVG puro
const ProgressRing = ({ title, percentage, color, subtitle }) => {
  const { D, isDark } = useTheme();
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="np-hover rounded-xl p-6 flex flex-col items-center relative overflow-hidden"
      style={{
        background: isDark ? 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(9,15,30,0.99))' : D.surface,
        border: `1px solid ${isDark ? 'rgba(34,197,94,0.1)' : D.border}`,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.35), transparent)' }} />
      <h4 className="font-semibold mb-4 self-start" style={{ color: D.text }}>{title}</h4>
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke={D.border} strokeWidth="10" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color: D.text }}>{percentage}%</span>
        </div>
      </div>
      {subtitle && <p className="text-sm mt-2" style={{ color: D.muted }}>{subtitle}</p>}
    </motion.div>
  );
};

// Gráfico SVG simple (bar / line / area)
const TrendChart = ({ title, data = [], dataKey, type = 'line', color = '#3b82f6', xAxisDataKey = 'name', height = 180 }) => {
  const { D, isDark } = useTheme();
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values) || 1;
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 300;
  const h = height - 40;
  const barW = w / data.length - 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d[dataKey] - min) / range) * h;
    return `${x},${y}`;
  });

  const areaPoints = `0,${h} ${points.join(' ')} ${w},${h}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="np-hover rounded-xl p-6 relative overflow-hidden"
      style={{
        background: isDark ? 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(9,15,30,0.99))' : D.surface,
        border: `1px solid ${isDark ? 'rgba(34,197,94,0.1)' : D.border}`,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)' }} />
      <h4 className="font-semibold mb-4" style={{ color: D.text }}>{title}</h4>
      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full" style={{ height }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="0" y1={h * t} x2={w} y2={h * t} stroke={D.border} strokeWidth="1" />
        ))}

        {type === 'bar' && data.map((d, i) => {
          const barH = ((d[dataKey] - min) / range) * h;
          const x = i * (w / data.length) + 2;
          return (
            <g key={i}>
              <rect x={x} y={h - barH} width={barW} height={barH} fill={color} rx="3" opacity="0.85" />
              <text x={x + barW / 2} y={h + 18} textAnchor="middle" fontSize="10" fill={D.muted}>
                {d[xAxisDataKey]}
              </text>
            </g>
          );
        })}

        {type === 'area' && (
          <>
            <polygon points={areaPoints} fill={color} opacity="0.15" />
            <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {type === 'line' && (
          <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {type !== 'bar' && data.map((d, i) => (
          <text key={i} x={(i / (data.length - 1)) * w} y={h + 18}
            textAnchor="middle" fontSize="10" fill={D.muted}>
            {d[xAxisDataKey]}
          </text>
        ))}

        {type !== 'bar' && points.map((p, i) => {
          const [x, y] = p.split(',');
          return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2" />;
        })}
      </svg>
    </motion.div>
  );
};

// ============================================
// DASHBOARD PRODUCTOR COMPONENT
// ============================================

const DashboardProductor = () => {
  const { D, isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // currentTab derivado de la URL
  const currentTab = location.pathname.split('/dashboard-productor/')[1]?.split('/')[0] || 'inicio';
  const isHome = currentTab === 'inicio' || currentTab === '';
  const [dashStats, setDashStats] = useState(null);
  const [produccionStats, setProduccionStats] = useState(null);

  const { data: sensorsData, isConnected, alerts, bombaStatus, refreshData } = useSensorData();

  useEffect(() => {
    const fetchDashStats = async () => {
      try {
        const response = await api.get('/estadisticas/productor');
        setDashStats(response.data.data);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Error cargando stats del dashboard:', err?.message);
      }
    };

    const fetchProduccion = async () => {
      try {
        const res = await api.get('/lagunas');
        const lagunas = res.data?.data || [];
        const activas = lagunas.filter(l => l.produccion);
        const totalPeces = activas.reduce((s, l) => s + (l.produccion?.peces_actuales || 0), 0);
        const totalBiomasa = activas.reduce((s, l) => s + (l.produccion?.biomasaKg || 0), 0);
        const totalAlimento = activas.reduce((s, l) => s + (l.produccion?.alimentacion?.totalDiaKg || 0), 0);
        setProduccionStats({ count: activas.length, totalPeces, totalBiomasa: Math.round(totalBiomasa * 10) / 10, totalAlimento: Math.round(totalAlimento * 10) / 10 });
      } catch (_) {}
    };

    fetchDashStats();
    fetchProduccion();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const isOutOfRange = (sensorData) => sensorData?.isOutOfRange || false;

  const getPageTitle = () => {
    const titles = {
      inicio: 'Panel Principal', dashboard: 'Panel Principal', monitoring: 'Monitoreo Tambaqui',
      pedidos: 'Pedidos', inventario: 'Inventario', perfil: 'Perfil',
      estadisticas: 'Estadísticas', mensajes: 'Mensajes',
      notificaciones: 'Notificaciones', ajustes: 'Ajustes', ayuda: 'Ayuda',
    };
    return titles[currentTab] || currentTab;
  };

  const getSystemStatus = () => {
    if (!isConnected) return { text: 'Sistema desconectado', color: 'red' };
    if (alerts.length > 0) return { text: 'Alertas activas', color: 'yellow' };
    return { text: 'Sistema operativo', color: 'green' };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="np-orb-bg np-grid min-h-screen flex flex-col" style={{ background: D.bg }}>
      <ParticleBackground />
      {/* ── Header ── */}
      <header className="glass sticky top-0 z-30" style={{
        borderBottom: `1px solid ${D.border}`,
        boxShadow: isDark ? '0 4px 40px rgba(34,197,94,0.08)' : '0 2px 20px rgba(14,116,193,0.07)',
      }}>
        {/* Top glow line */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${D.primary}, ${D.teal}, transparent)` }} />

        <div className="flex justify-between items-center px-4 py-3 lg:px-6">
          <div className="flex items-center min-w-0 flex-1">
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg mr-3 lg:hidden transition-colors"
                style={{ color: D.primary, background: isDark ? 'rgba(34,197,94,0.08)' : D.inputBg, border: `1px solid ${D.border}` }}>
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', boxShadow: '0 0 16px rgba(34,197,94,0.4)' }}>
                <Fish className="text-white w-5 h-5" />
              </motion.div>
              <div className="min-w-0">
                <GlitchText as="h1" className="text-lg font-bold truncate" style={{ color: D.text }} continuous>NaturaPiscis</GlitchText>
                {!isMobile && <p className="text-xs truncate" style={{ color: D.primary }}>{getPageTitle()}</p>}
              </div>
            </div>
          </div>

          {isMobile && (
            <div className="flex-1 text-center mx-4">
              <h2 className="text-base font-semibold truncate" style={{ color: D.text }}>{getPageTitle()}</h2>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme toggle */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
              className="p-2 rounded-lg transition-colors"
              style={{ background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(14,116,193,0.08)', border: `1px solid ${D.border}`, cursor: 'pointer' }}>
              {isDark
                ? <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
                : <Moon className="w-4 h-4" style={{ color: D.primary }} />}
            </motion.button>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={refreshData} className="p-2 rounded-lg transition-colors"
              style={{ background: isDark ? 'rgba(34,197,94,0.06)' : D.inputBg, border: `1px solid ${D.border}` }}>
              <motion.div animate={{ rotate: isConnected ? 360 : 0 }}
                transition={{ duration: 3, repeat: isConnected ? Infinity : 0, ease: 'linear' }}>
                <Fish className="w-4 h-4" style={{ color: D.primary }} />
              </motion.div>
            </motion.button>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg relative transition-colors"
              style={{ background: isDark ? 'rgba(34,197,94,0.06)' : D.inputBg, border: `1px solid ${D.border}` }}>
              <Bell className="w-4 h-4" style={{ color: D.primary }} />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
                  style={{ fontSize: 9, boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>
                  {alerts.length}
                </span>
              )}
            </motion.button>

            {/* System status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: systemStatus.color === 'green' ? 'rgba(34,197,94,0.1)' : systemStatus.color === 'yellow' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${systemStatus.color === 'green' ? 'rgba(34,197,94,0.3)' : systemStatus.color === 'yellow' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: systemStatus.color === 'green' ? '#22c55e' : systemStatus.color === 'yellow' ? '#eab308' : '#ef4444' }} />
              <span className="text-xs font-medium"
                style={{ color: systemStatus.color === 'green' ? '#4ade80' : systemStatus.color === 'yellow' ? '#facc15' : '#f87171' }}>
                {systemStatus.text}
              </span>
            </div>
          </div>
        </div>

        {!isMobile && isHome && (
          <div className="px-6 pb-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: D.muted }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: D.primary }}>
              <Fish className="h-3 w-3" />
              <span>{TAMBAQUI_INFO.nombreComun}</span>
            </div>
          </div>
        )}
      </header>

      {/* ── Layout ── */}
      <div className="flex flex-1 min-h-0">
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }}
                onClick={() => setSidebarOpen(false)} />
              <motion.div initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed left-0 top-0 bottom-0 z-50">
                <SidebarProductor />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!isMobile && (
          <div className="flex-shrink-0">
            <SidebarProductor />
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-hidden dashboard-main" style={{ background: D.bg }}>
          <div className="h-full overflow-y-auto">
            <div className="p-4 lg:p-6">
              {isHome && (
                <div className="space-y-6">

                  {/* Banner bienvenida */}
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-8 relative overflow-hidden"
                    style={{
                      background: D.sidebarBg,
                      border: `1px solid ${D.border}`,
                      boxShadow: `0 0 40px ${D.shimmer}20`,
                    }}>
                    {/* Animated glow orbs */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20"
                      style={{ background: 'radial-gradient(circle, #22C55E, transparent)' }} />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-15"
                      style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
                    {/* Top glow line */}
                    <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #22C55E, #4ade80, transparent)' }} />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={14} style={{ color: '#22C55E' }} />
                          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#22C55E' }}>Sistema Activo</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-2" style={{ color: D.text }}>¡Bienvenido de vuelta!</h2>
                        <p className="text-lg mb-3" style={{ color: D.sub }}>
                          Monitorea tus estanques de tambaqui en tiempo real
                        </p>
                        <div className="flex items-center text-sm" style={{ color: D.muted }}>
                          <Fish className="h-4 w-4 mr-2" style={{ color: '#22C55E' }} />
                          <span>Especie: <span className="font-medium" style={{ color: '#22C55E' }}>{TAMBAQUI_INFO.nombreCientifico}</span></span>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium"
                          style={{
                            background: systemStatus.color === 'green' ? 'rgba(34,197,94,0.1)' : systemStatus.color === 'yellow' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${systemStatus.color === 'green' ? 'rgba(34,197,94,0.3)' : systemStatus.color === 'yellow' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: systemStatus.color === 'green' ? '#4ade80' : systemStatus.color === 'yellow' ? '#facc15' : '#f87171',
                          }}>
                          <div className="h-2 w-2 rounded-full mr-2 animate-pulse"
                            style={{ background: systemStatus.color === 'green' ? '#22c55e' : systemStatus.color === 'yellow' ? '#eab308' : '#ef4444' }} />
                          {systemStatus.text}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* KPI Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                      title="Prod. Mes Actual"
                      value={dashStats?.produccionTotal ?? '0'}
                      unit="kg"
                      icon={TrendingUp}
                      trend="+5.2%"
                      trendUp={true}
                      color="green"
                    />
                    <StatsCard
                      title="Ingresos Mes"
                      value={dashStats ? `Bs ${dashStats.ventasTotales?.toFixed(0)}` : '—'}
                      icon={BarChart3}
                      trend="+12.5%"
                      trendUp={true}
                      color="blue"
                    />
                    <StatsCard
                      title="Pedidos Activos"
                      value={dashStats?.pedidosActivos ?? '0'}
                      icon={ShoppingBag}
                      trend="2 urgentes"
                      trendUp={true}
                      color="purple"
                    />
                    <StatsCard
                      title="Clientes Activos"
                      value={dashStats?.clientesActivos ?? '—'}
                      icon={Droplets}
                      trend="compradores"
                      trendUp={true}
                      color="orange"
                    />
                  </div>

                  {/* Producción — widget */}
                  {produccionStats !== null && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="np-hover rounded-xl p-5 relative overflow-hidden cursor-pointer"
                      onClick={() => navigate('/dashboard-productor/inventario')}
                      style={{
                        background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(20,184,166,0.05))',
                        border: '1px solid rgba(74,222,128,0.2)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                      }}>
                      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.5), transparent)' }} />
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)' }}>
                            <Package className="h-4 w-4" style={{ color: '#4ade80' }} />
                          </div>
                          <h4 className="font-semibold" style={{ color: '#4ade80' }}>Mi Producción</h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(74,222,128,0.7)' }}>
                          <span>Ver inventario</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                      {produccionStats.count === 0 ? (
                        <p className="text-sm text-center py-2" style={{ color: '#64748b' }}>Sin siembras activas — haz clic para iniciar</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold" style={{ color: '#4ade80' }}>{produccionStats.count}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>Lagunas activas</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{produccionStats.totalPeces.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>Peces</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold" style={{ color: '#fb923c' }}>{produccionStats.totalBiomasa}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>Biomasa (kg)</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold" style={{ color: '#c084fc' }}>{produccionStats.totalAlimento}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>Alimento/día (kg)</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Sensores + Bomba */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sensorsData ? (
                      <>
                        <SensorCard title="Temperatura" icon={Thermometer}
                          value={sensorsData.temperatura.value} unit={sensorsData.temperatura.unit}
                          iconColor="#f87171" iconBg="rgba(239,68,68,0.15)"
                          isOutOfRange={isOutOfRange(sensorsData.temperatura)} />
                        <SensorCard title="pH" icon={Waves}
                          value={sensorsData.ph.value} unit={sensorsData.ph.unit}
                          iconColor="#38bdf8" iconBg="rgba(14,165,233,0.15)"
                          isOutOfRange={isOutOfRange(sensorsData.ph)} />
                        <SensorCard title="Turbidez" icon={Eye}
                          value={sensorsData.turbidez.value} unit={sensorsData.turbidez.unit}
                          iconColor="#facc15" iconBg="rgba(234,179,8,0.15)"
                          isOutOfRange={isOutOfRange(sensorsData.turbidez)} />
                        <div className="np-hover rounded-xl p-6"
                          style={{
                            background: bombaStatus.isOn ? 'rgba(34,197,94,0.08)' : (isDark ? 'rgba(255,255,255,0.03)' : D.surface),
                            border: `1px solid ${bombaStatus.isOn ? 'rgba(34,197,94,0.25)' : D.border}`,
                            boxShadow: bombaStatus.isOn ? '0 0 20px rgba(34,197,94,0.1)' : 'none',
                          }}>
                          <div className="flex items-center">
                            <div className="p-3 rounded-xl"
                              style={{ background: bombaStatus.isOn ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)' }}>
                              <Power className="h-6 w-6"
                                style={{ color: bombaStatus.isOn ? '#4ade80' : '#475569' }}
                                {...(bombaStatus.isOn ? { className: 'h-6 w-6 animate-pulse' } : {})} />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium" style={{ color: '#64748b' }}>Bomba Enfriamiento</p>
                              <p className="text-2xl font-bold" style={{ color: bombaStatus.isOn ? '#4ade80' : '#334155' }}>
                                {bombaStatus.isOn ? 'ON' : 'OFF'}
                              </p>
                              {bombaStatus.isOn && (
                                <div className="flex items-center text-xs mt-1" style={{ color: '#4ade80' }}>
                                  <Zap className="h-3 w-3 mr-1" /><span>Enfriando agua</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      [...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl p-6 animate-pulse"
                          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : D.surface, border: `1px solid ${D.border}` }}>
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : D.bg }} />
                            <div className="ml-4 flex-1">
                              <div className="h-4 rounded w-3/4 mb-2" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : D.bg }} />
                              <div className="h-6 rounded w-1/2" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : D.bg }} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Alertas */}
                  {alerts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-6"
                      style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', boxShadow: '0 0 20px rgba(251,146,60,0.05)' }}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: D.text }}>
                        <AlertTriangle className="h-5 w-5 mr-2" style={{ color: '#fb923c' }} />
                        Alertas para Tambaqui ({alerts.length})
                      </h3>
                      <div className="space-y-3">
                        {alerts.map((alert, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center p-4 rounded-xl border-l-4"
                            style={{
                              background: alert.severity === 'high' ? 'rgba(239,68,68,0.08)' : alert.severity === 'medium' ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)',
                              borderLeftColor: alert.severity === 'high' ? '#f87171' : alert.severity === 'medium' ? '#facc15' : '#22C55E',
                              color: alert.severity === 'high' ? '#f87171' : alert.severity === 'medium' ? '#facc15' : '#22C55E',
                            }}>
                            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'inherit' }}>{alert.message}</p>
                              <p className="text-xs mt-1 opacity-75">
                                Parámetro: {alert.type} | Valor: {alert.value}{alert.unit}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Gráficos de tendencias */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart
                      title="Tendencia Temperatura (Últimas 24h)"
                      data={[
                        { name: '00:00', temp: 26.5 }, { name: '04:00', temp: 25.8 },
                        { name: '08:00', temp: 27.2 }, { name: '12:00', temp: 28.5 },
                        { name: '16:00', temp: 29.1 }, { name: '20:00', temp: 27.8 },
                        { name: '24:00', temp: 26.2 },
                      ]}
                      dataKey="temp" type="area" color="#ef4444" xAxisDataKey="name"
                    />
                    <TrendChart
                      title="Tendencia pH (Últimas 24h)"
                      data={[
                        { name: '00:00', ph: 7.2 }, { name: '04:00', ph: 7.1 },
                        { name: '08:00', ph: 7.3 }, { name: '12:00', ph: 7.4 },
                        { name: '16:00', ph: 7.35 }, { name: '20:00', ph: 7.2 },
                        { name: '24:00', ph: 7.1 },
                      ]}
                      dataKey="ph" type="line" color="#3b82f6" xAxisDataKey="name"
                    />
                  </div>

                  {/* Producción + Actividad + Progreso */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TrendChart
                      title="Producción Semanal (kg)"
                      data={[
                        { name: 'Lun', produccion: 125 }, { name: 'Mar', produccion: 138 },
                        { name: 'Mié', produccion: 142 }, { name: 'Jue', produccion: 156 },
                        { name: 'Vie', produccion: 165 }, { name: 'Sáb', produccion: 158 },
                        { name: 'Dom', produccion: 145 },
                      ]}
                      dataKey="produccion" type="bar" color="#10b981" xAxisDataKey="name" height={250}
                    />

                    <ActivityFeed activities={[
                      { type: 'order',   title: 'Pedido completado',   description: 'Manuel García - 50kg Tambaqui',     timestamp: 'Hace 2 horas', badge: 'Entregado' },
                      { type: 'alert',   title: 'pH fuera de rango',   description: 'Estanque 2: pH 7.8 (alto)',         timestamp: 'Hace 30 min' },
                      { type: 'success', title: 'Temperatura normada', description: 'Estanque 1 volvió a rango óptimo', timestamp: 'Hace 15 min' },
                      { type: 'order',   title: 'Nuevo pedido',        description: 'Rosa López - 75kg Tambaqui',        timestamp: 'Hace 5 min' },
                    ]} />

                    <div className="space-y-4">
                      <ProgressRing title="Ocupación Estanque" percentage={78} color="#8b5cf6" subtitle="225 de 290 peces" />
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="np-hover rounded-xl p-5 relative overflow-hidden"
                        style={{
                          background: isDark ? 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(9,15,30,0.99))' : D.surface,
                          border: `1px solid ${isDark ? 'rgba(34,197,94,0.1)' : D.border}`,
                          backdropFilter: isDark ? 'blur(12px)' : 'none',
                          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 8px rgba(0,0,0,0.06)',
                        }}>
                        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)' }} />
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: D.text }}>
                          <Clock className="h-4 w-4" style={{ color: D.primary }} /> Próximas Tareas
                        </h4>
                        <ul className="space-y-1.5 text-sm">
                          {[
                            { color: '#22C55E', text: 'Medición pH (16:00)' },
                            { color: '#fb923c', text: 'Recolecta muestras (18:00)' },
                            { color: '#4ade80', text: 'Revisión bomba (20:00)' },
                            { color: '#c084fc', text: 'Alimentación nocturna (21:00)' },
                          ].map((t, i) => (
                            <li key={i} className="flex items-center p-1.5 rounded-lg transition-colors"
                              style={{ color: D.muted }}
                              onMouseEnter={e => e.currentTarget.style.background = D.border}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <span className="w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                              {t.text}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>
                  </div>

                  {/* Info cultivo */}
                  <div className="rounded-xl p-6"
                    style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.06))', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="flex items-start">
                      <div className="p-2 rounded-xl flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <Fish className="h-6 w-6" style={{ color: '#22C55E' }} />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold mb-3" style={{ color: '#22C55E' }}>
                          Información del Cultivo — {TAMBAQUI_INFO.nombreComun}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style={{ color: D.muted }}>
                          <div className="space-y-1">
                            <p><span style={{ color: D.text, fontWeight: 600 }}>Temperatura óptima:</span> {TAMBAQUI_INFO.temperaturaOptima}</p>
                            <p><span style={{ color: D.text, fontWeight: 600 }}>Tolerancia:</span> {TAMBAQUI_INFO.temperaturaTolerancia}</p>
                          </div>
                          <div className="space-y-1">
                            <p><span style={{ color: D.text, fontWeight: 600 }}>pH óptimo:</span> {TAMBAQUI_INFO.phOptimo}</p>
                            <p><span style={{ color: D.text, fontWeight: 600 }}>Alimentación:</span> {TAMBAQUI_INFO.alimentacion}</p>
                          </div>
                          <div className="space-y-1">
                            <p><span style={{ color: D.text, fontWeight: 600 }}>Peso máximo:</span> {TAMBAQUI_INFO.pesoMaximo}</p>
                            <p><span style={{ color: D.text, fontWeight: 600 }}>Origen:</span> {TAMBAQUI_INFO.habitat}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botón monitoreo avanzado */}
                  <div className="rounded-xl p-6 relative overflow-hidden"
                    style={{
                      background: isDark ? 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(9,15,30,0.99))' : D.surface,
                      border: `1px solid ${isDark ? 'rgba(34,197,94,0.1)' : D.border}`,
                      backdropFilter: isDark ? 'blur(12px)' : 'none',
                      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                    <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.35), transparent)' }} />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: D.text }}>Monitoreo Avanzado</h3>
                        <p style={{ color: D.muted }}>
                          Dashboard completo con gráficos históricos y controles avanzados
                        </p>
                      </div>
                      <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(34,197,94,0.4)' }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard-productor/monitoring')}
                        className="px-6 py-3 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
                        <Fish className="h-5 w-5" />
                        Ver Monitoreo
                      </motion.button>
                    </div>
                  </div>

                </div>
              )}

              {!isHome && <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardProductor;