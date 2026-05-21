"use client"
import { motion } from "framer-motion"
import {
  ShoppingBag,
  Clock,
  Star,
  ChevronRight,
  Fish,
  Droplets,
  Truck,
  Award,
  ShoppingCart,
  Heart,
  TrendingUp,
  PackageCheck,
} from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StatsCard, TrendChart, ActivityFeed, ProgressRing } from '../../components/dashboard';
import { useDestacados, usePedidosRecientes, useStatsConsumidor } from '../../hooks/queries';

const Inicio = () => {
  const { user } = useAuth();
  const { D, isDark } = useTheme();
  const navigate = useNavigate();

  const { data: featuredProducts = [], isLoading: loadingProductos } = useDestacados()
  const { data: recentOrders = [],   isLoading: loadingPedidos   } = usePedidosRecientes()
  const { data: stats }                                             = useStatsConsumidor()
  const loading = loadingProductos || loadingPedidos

  const totalCompras   = stats?.total_pedidos   ?? '—'
  const gastoTotal     = stats?.gasto_total     != null ? `Bs ${Number(stats.gasto_total).toFixed(0)}` : '—'
  const pedidosActivos = stats?.pedidos_activos ?? '—'

  const DIAS_ES = { Mon:'Lun', Tue:'Mar', Wed:'Mié', Thu:'Jue', Fri:'Vie', Sat:'Sáb', Sun:'Dom' }
  const chartData = stats?.gastos_por_dia?.length
    ? stats.gastos_por_dia.map(d => ({ name: DIAS_ES[d.dia] ?? d.dia, gasto: Number(d.gasto) }))
    : [{ name: 'Lun', gasto: 0 }, { name: 'Mar', gasto: 0 }, { name: 'Mié', gasto: 0 },
       { name: 'Jue', gasto: 0 }, { name: 'Vie', gasto: 0 }, { name: 'Sáb', gasto: 0 }, { name: 'Dom', gasto: 0 }]

  const actividadReciente = recentOrders.slice(0, 4).map(o => ({
    type:        o.estado === 'entregado' ? 'order' : 'info',
    title:       `Pedido #${o.id}`,
    description: `${o.estado} · Bs ${Number(o.total).toFixed(2)}`,
    timestamp:   new Date(o.fecha_pedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    badge:       o.estado === 'entregado' ? 'Entregado' : undefined,
  }))

  // Theme-aware helpers
  const card    = isDark ? 'rgba(255,255,255,0.03)' : D.surface
  const cardHov = isDark ? 'rgba(255,255,255,0.06)' : '#f0f7ff'
  const skel    = isDark ? 'rgba(255,255,255,0.06)' : '#e2ecf5'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  return (
    <motion.div className="p-6 h-full overflow-auto" initial="hidden" animate="visible" variants={containerVariants}
      style={{ background: D.bg }}>

      {/* Hero Banner */}
      <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden mb-6 relative"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #061a10 0%, #0a2818 40%, #061f14 100%)'
            : 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.35)'}`,
          boxShadow: isDark ? '0 8px 60px rgba(0,0,0,0.6)' : '0 8px 40px rgba(22,163,74,0.25)',
        }}>

        {/* Layered animated waves */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ height: 80 }}>
            <motion.path fill="rgba(34,197,94,0.08)"
              animate={{ d: [
                "M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,120 L0,120 Z",
                "M0,55 C240,95 480,15 720,55 C960,95 1200,15 1440,55 L1440,120 L0,120 Z",
                "M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,120 L0,120 Z",
              ]}}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ height: 55 }}>
            <motion.path fill="rgba(74,222,128,0.06)"
              animate={{ d: [
                "M0,40 C360,80 720,0 1080,50 C1260,75 1380,20 1440,40 L1440,100 L0,100 Z",
                "M0,60 C360,20 720,75 1080,30 C1260,10 1380,70 1440,60 L1440,100 L0,100 Z",
                "M0,40 C360,80 720,0 1080,50 C1260,75 1380,20 1440,40 L1440,100 L0,100 Z",
              ]}}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            />
          </svg>
          <motion.div className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute -bottom-8 left-1/4 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        </div>

        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #22C55E, #4ade80, #a78bfa, transparent)' }} />

        <div className="relative px-6 py-12 md:px-10 md:flex md:items-center md:justify-between gap-8">
          <div className="flex-1">
            <motion.div className="flex items-center gap-2 mb-3"
              animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4ade80' }}>
                Marketplace Acuícola · En línea
              </span>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              ¡Bienvenido,{' '}
              <span style={{ background: 'linear-gradient(135deg, #22C55E, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {user?.nombre?.split(' ')[0] || 'Usuario'}
              </span>
              !
            </h2>
            <p className="text-base md:text-lg mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Productos acuícolas frescos directo del productor
            </p>

            <div className="flex flex-wrap gap-3 mb-5">
              {[
                { label: '2,500+ clientes', color: '#22C55E' },
                { label: '150+ productores', color: '#4ade80' },
                { label: '4.8 ★ promedio', color: '#facc15' },
              ].map(({ label, color }) => (
                <span key={label} className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: color + '22', border: `1px solid ${color}50`, color }}>
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Tienda
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 32px rgba(34,197,94,0.55)' }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22C55E)', boxShadow: '0 0 20px rgba(34,197,94,0.4)' }}>
                <Fish className="h-4 w-4 mr-2" />
                Ver Productores
              </motion.button>
            </div>
          </div>

          <motion.div className="hidden md:flex items-center justify-center flex-shrink-0"
            animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30"
                style={{ background: 'radial-gradient(circle, #22C55E, transparent)' }} />
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(74,222,128,0.12))', border: '1px solid rgba(34,197,94,0.35)', backdropFilter: 'blur(10px)' }}>
                <Fish size={44} style={{ color: '#22C55E', filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.7))' }} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* KPI Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Mis Compras"    value={String(totalCompras)}   icon={ShoppingBag} color="blue"   />
        <StatsCard title="Gasto Total"    value={gastoTotal}             icon={TrendingUp}  color="green"  />
        <StatsCard title="Pedidos Activos"value={String(pedidosActivos)} icon={PackageCheck}color="purple" />
        <StatsCard title="Productos Frescos" value={String(featuredProducts.length || '—')} icon={Fish} color="red" />
      </motion.div>

      {/* Gráficos y Actividad */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <TrendChart
          title="Tus Gastos (Últimos 7 días)"
          data={chartData}
          dataKey="gasto"
          type="bar"
          color={D.primary}
          xAxisDataKey="name"
          height={250}
        />

        <ActivityFeed
          title="Pedidos Recientes"
          activities={actividadReciente.length ? actividadReciente : [
            { type: 'info', title: 'Sin actividad aún', description: 'Tus pedidos aparecerán aquí', timestamp: '' },
          ]}
          maxItems={4}
        />

        <div className="space-y-4">
          <ProgressRing
            title="Nivel VIP"
            percentage={65}
            color="#8b5cf6"
            subtitle="750/1000 puntos de lealtad"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
          >
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm" style={{ color: D.orange }}>
              <Award className="h-4 w-4" />
              Próxima Recompensa
            </h4>
            <p className="text-sm" style={{ color: D.muted }}>250 puntos para obtener $25 de descuento</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Características principales */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Fish,    title: "Productos Frescos",   description: "Directamente de productores locales", glow: D.primary },
          { icon: Droplets,title: "Cultivo Sostenible",  description: "Respetuoso con el medio ambiente",    glow: D.teal   },
          { icon: Truck,   title: "Entrega Rápida",      description: "A tu puerta en 24-48 horas",          glow: D.green  },
          { icon: Award,   title: "Calidad Garantizada", description: "Productos certificados",               glow: D.purple },
        ].map((feature, index) => (
          <motion.div key={index} whileHover={{ y: -4 }}
            className="np-hover p-4 rounded-xl flex items-start gap-3"
            style={{ background: card, border: `1px solid ${D.border}` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}>
            <div className="p-2 rounded-lg flex-shrink-0"
              style={{ background: `${feature.glow}18`, border: `1px solid ${feature.glow}30` }}>
              <feature.icon className="h-5 w-5" style={{ color: feature.glow }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: D.text }}>{feature.title}</h3>
              <p className="text-xs mt-0.5" style={{ color: D.muted }}>{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Analizar frescura */}
      <motion.div variants={itemVariants} className="mb-6">
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(34,197,94,0.15)' }}
          onClick={() => navigate('/dashboard-consumidor/analizar-frescura')}
          style={{
            background: isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.05)',
            border: '1.5px solid rgba(34,197,94,0.3)',
            borderRadius: 16, padding: '18px 22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 18, transition: 'box-shadow 0.2s',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>🔬</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: D.text, margin: '0 0 4px' }}>¿Tu pescado está fresco?</h3>
            <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>Sube una foto y nuestra IA analiza su frescura en segundos</p>
          </div>
          <ChevronRight size={20} color="#22c55e" style={{ flexShrink: 0 }} />
        </motion.div>
      </motion.div>

      {/* Productos destacados */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: D.text }}>Productos Destacados</h2>
          <motion.a href="#" className="text-sm flex items-center transition-colors" style={{ color: D.primary }} whileHover={{ x: 4 }}>
            Ver todos
            <ChevronRight className="h-4 w-4 ml-1" />
          </motion.a>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden h-64 animate-pulse"
                style={{ background: card, border: `1px solid ${D.border}` }}>
                <div className="h-40" style={{ background: skel }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded w-3/4" style={{ background: skel }} />
                  <div className="h-4 rounded w-1/2" style={{ background: skel }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProducts.slice(0, 6).map((product) => (
              <motion.div key={product.id} whileHover={{ y: -6 }}
                className="np-hover rounded-2xl overflow-hidden group relative"
                style={{ background: card, border: `1px solid ${D.border}`, backdropFilter: 'blur(12px)', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${D.primary}55`; e.currentTarget.style.boxShadow = `0 8px 32px ${D.primary}18` }}
                onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${D.border}`; e.currentTarget.style.boxShadow = 'none' }}>
                <div className="relative">
                  <img src={product.imagen || "/placeholder.svg"} alt={product.nombre}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-colors"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                    <Heart className="h-4 w-4" />
                  </motion.button>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-semibold leading-tight" style={{ color: D.text }}>{product.nombre}</h3>
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs" style={{ color: D.sub }}>{product.promedio_valoracion || 0}</span>
                    </div>
                  </div>
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: D.muted }}>{product.descripcion}</p>
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full"
                      style={{ background: `${D.primary}18`, border: `1px solid ${D.primary}35`, color: D.primary }}>
                      {product.categoria_nombre || 'Sin categoría'}
                    </span>
                    <span style={{ color: D.dim }}>•</span>
                    <span style={{ color: D.muted }}>{product.productor_nombre || 'Productor'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: D.primary }}>
                      Bs {Number(product.precio).toFixed(2)}
                    </span>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' }}>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Añadir
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pedidos recientes y resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-2 np-hover rounded-xl p-5"
          style={{ background: card, border: `1px solid ${D.border}` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: D.text }}>Pedidos Recientes</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-lg"
                  style={{ background: skel }}>
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full" style={{ background: skel }} />
                    <div>
                      <div className="h-4 rounded w-24 mb-2" style={{ background: skel }} />
                      <div className="h-3 rounded w-16" style={{ background: skel }} />
                    </div>
                  </div>
                  <div className="h-6 rounded w-20" style={{ background: skel }} />
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map((order) => (
                <motion.div key={order.id} whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{ border: `1px solid ${D.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = cardHov}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full"
                      style={{ background: `${D.primary}18`, border: `1px solid ${D.primary}30` }}>
                      <ShoppingBag className="h-4 w-4" style={{ color: D.primary }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: D.text }}>Pedido #{order.id}</h3>
                      <p className="text-xs" style={{ color: D.muted }}>
                        {new Date(order.fecha_pedido).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs rounded-full"
                      style={{
                        background: order.estado === 'entregado' ? 'rgba(74,222,128,0.12)' : order.estado === 'en_camino' ? `${D.primary}15` : 'rgba(251,191,36,0.12)',
                        color:      order.estado === 'entregado' ? D.green                 : order.estado === 'en_camino' ? D.primary        : D.yellow,
                        border:     `1px solid ${order.estado === 'entregado' ? D.green + '40' : order.estado === 'en_camino' ? D.primary + '40' : D.yellow + '40'}`,
                      }}>
                      {order.estado}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: D.primary }}>
                      Bs {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
              <motion.a href="#" className="block text-center text-sm mt-3 transition-colors"
                style={{ color: D.primary }} whileHover={{ y: -2 }}>
                Ver historial completo
              </motion.a>
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: D.muted }}>
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: D.primary }} />
              <p className="text-sm">No tienes pedidos recientes</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="mt-3 px-4 py-2 text-white rounded-xl text-sm"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' }}>
                Explorar productos
              </motion.button>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="np-hover rounded-xl p-5"
          style={{ background: card, border: `1px solid ${D.border}` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: D.text }}>Resumen</h2>
          <div className="space-y-4">
            {[
              { icon: ShoppingBag,  text: `${totalCompras} pedidos en total`,             glow: D.primary },
              { icon: TrendingUp,   text: `${gastoTotal} gastado`,                         glow: D.green   },
              { icon: PackageCheck, text: `${pedidosActivos} pedidos en curso`,            glow: D.purple  },
              { icon: Clock,        text: `${recentOrders.length} pedidos en historial`,   glow: D.orange  },
            ].map((item, index) => (
              <motion.div key={index} className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}>
                <div className="p-2 rounded-full flex-shrink-0"
                  style={{ background: `${item.glow}18`, border: `1px solid ${item.glow}30` }}>
                  <item.icon className="h-4 w-4" style={{ color: item.glow }} />
                </div>
                <p className="text-sm font-medium" style={{ color: D.text }}>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Inicio
