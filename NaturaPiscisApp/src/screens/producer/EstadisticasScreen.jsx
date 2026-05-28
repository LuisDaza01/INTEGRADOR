// src/screens/producer/EstadisticasScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions, Image, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';
import api from '../../api/axios.config';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CHART_W = width - 48;
const CHART_H = 160;
const PAD = { top: 10, right: 10, bottom: 32, left: 44 };

// ── Gráfico de barras SVG ─────────────────────────────────────
const BarChart = ({ data, color, isDark }) => {
  if (!data?.length) return null;
  const w   = CHART_W - PAD.left - PAD.right;
  const h   = CHART_H - PAD.top  - PAD.bottom;
  const max = Math.max(...data.map(d => d.valor || 0), 1);
  const barW = Math.max(4, Math.floor(w / data.length) - 4);
  const textC = isDark ? '#9ca3af' : '#6b7280';
  const gridC = isDark ? '#374151' : '#f3f4f6';

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </LinearGradient>
      </Defs>
      {[0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = PAD.top + h * (1 - f);
        return (
          <React.Fragment key={i}>
            <Path d={`M${PAD.left} ${y} L${PAD.left + w} ${y}`}
              stroke={gridC} strokeWidth="1" fill="none" />
            <SvgText x={PAD.left - 4} y={y + 4} fontSize="9" fill={textC} textAnchor="end">
              {Math.round(max * f)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {data.map((d, i) => {
        const barH = Math.max(2, ((d.valor || 0) / max) * h);
        const x    = PAD.left + (w / data.length) * i + 2;
        const y    = PAD.top + h - barH;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx="4" fill="url(#bg)" />
            <SvgText x={x + barW / 2} y={PAD.top + h + 16}
              fontSize="9" fill={textC} textAnchor="middle">
              {d.mes || d.label || ''}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

// ── Gráfico de predicción SVG ────────────────────────────────
const PRED_H = 185;
const PredictionLineChart = ({ historico, prediccion, isDark }) => {
  const allPts = [...historico, ...prediccion];
  if (!allPts.length) return null;

  const PL = 50, PR = 12, PT = 10, PB = 36;
  const W  = CHART_W;
  const H  = PRED_H;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const maxVal = Math.max(...allPts.map(p => p.upper ?? p.valor), 1);
  const n      = allPts.length;
  const lastH  = historico.length - 1;

  const textC = isDark ? '#9ca3af' : '#6b7280';
  const gridC = isDark ? '#374151' : '#e5e7eb';

  const xS = (i) => PL + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
  const yS = (v) => PT + cH - Math.min((Math.max(v, 0) / maxVal) * cH, cH);

  const yTicks = [0.25, 0.5, 0.75, 1].map(f => maxVal * f);

  const histD = historico
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(p.valor).toFixed(1)}`)
    .join(' ');

  const predD = prediccion.length
    ? [`M${xS(lastH).toFixed(1)},${yS(historico[lastH].valor).toFixed(1)}`,
       ...prediccion.map((p, i) => `L${xS(lastH + 1 + i).toFixed(1)},${yS(p.valor).toFixed(1)}`)
      ].join(' ')
    : '';

  const bandUpper = prediccion.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xS(lastH + 1 + i).toFixed(1)},${yS(p.upper).toFixed(1)}`
  );
  const bandLower = [...prediccion].reverse().map((p, i) =>
    `L${xS(lastH + prediccion.length - i).toFixed(1)},${yS(p.lower).toFixed(1)}`
  );
  const bandD = prediccion.length ? [...bandUpper, ...bandLower, 'Z'].join(' ') : '';

  const skip = Math.max(1, Math.ceil(n / 7));

  return (
    <Svg width={W} height={H}>
      {/* Grid + Y labels */}
      {yTicks.map((v, i) => {
        const y = yS(v);
        const lbl = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
        return (
          <React.Fragment key={i}>
            <Path d={`M${PL} ${y.toFixed(1)} L${W - PR} ${y.toFixed(1)}`}
              stroke={gridC} strokeWidth="0.5" fill="none" />
            <SvgText x={PL - 4} y={y + 4} fontSize="8" fill={textC} textAnchor="end">{lbl}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Separator between historical/prediction */}
      {prediccion.length > 0 && (
        <Path d={`M${xS(lastH).toFixed(1)} ${PT} L${xS(lastH).toFixed(1)} ${PT + cH}`}
          stroke={gridC} strokeWidth="1" strokeDasharray="4,3" fill="none" />
      )}

      {/* Confidence band */}
      {bandD ? <Path d={bandD} fill="rgba(139,92,246,0.12)" stroke="none" /> : null}

      {/* Historical line */}
      <Path d={histD} fill="none" stroke="#38bdf8" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Prediction line */}
      {predD ? (
        <Path d={predD} fill="none" stroke="#8b5cf6" strokeWidth="2"
          strokeDasharray="7,4" strokeLinejoin="round" strokeLinecap="round" />
      ) : null}

      {/* Dots */}
      {historico.map((p, i) => (
        <Circle key={`h${i}`} cx={xS(i)} cy={yS(p.valor)} r="3" fill="#38bdf8" />
      ))}
      {prediccion.map((p, i) => (
        <Circle key={`p${i}`} cx={xS(lastH + 1 + i)} cy={yS(p.valor)} r="3" fill="#8b5cf6" />
      ))}

      {/* X labels */}
      {allPts.map((p, i) => {
        if (i % skip !== 0 && i !== n - 1) return null;
        const lbl = (p.mes || '').split(' ')[0];
        return (
          <SvgText key={i} x={xS(i).toFixed(1)} y={H - PB + 14}
            fontSize="8" fill={i > lastH ? '#8b5cf6' : textC} textAnchor="middle">
            {lbl}
          </SvgText>
        );
      })}
    </Svg>
  );
};

// ── Tarjeta de métrica ────────────────────────────────────────
const MetricCard = ({ icon, label, value, sub, color, bg }) => (
  <View style={[styles.metricCard, { backgroundColor: bg }]}>
    <View style={[styles.metricIcon, { backgroundColor: color + '25' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
    {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
  </View>
);

// ── Marketing KPI card con comparación real ──────────────────
const MKCard = ({ D, label, value, prefix = '', suffix = '', cambio, icon, color }) => {
  const sube = cambio > 0;
  const baja = cambio < 0;
  const colorCambio = sube ? '#22c55e' : baja ? '#ef4444' : D.textSecondary;
  return (
    <View style={[styles.mkCard, { backgroundColor: color + '12', borderColor: color + '30' }]}>
      <View style={styles.mkCardTop}>
        <Text style={[styles.mkCardLabel, { color: D.textSecondary }]} numberOfLines={1}>{label}</Text>
        <View style={[styles.mkCardIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={13} color={color} />
        </View>
      </View>
      <Text style={[styles.mkCardValue, { color }]} numberOfLines={1}>
        {prefix}{value}{suffix}
      </Text>
      {cambio !== undefined && cambio !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {sube ? <Ionicons name="trending-up" size={10} color={colorCambio} /> :
           baja ? <Ionicons name="trending-down" size={10} color={colorCambio} /> : null}
          <Text style={{ fontSize: 10, fontWeight: '700', color: colorCambio }}>
            {sube ? '+' : ''}{cambio}%
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Top producto ──────────────────────────────────────────────
const TopProducto = ({ rank, nombre, unidades, ingresos, colors }) => (
  <View style={[styles.topRow, { borderBottomColor: colors.border }]}>
    <View style={[styles.topRank, { backgroundColor: rank <= 3 ? '#fef9c3' : colors.surface }]}>
      <Text style={[styles.topRankText, { color: rank <= 3 ? '#854d0e' : colors.textSecondary }]}>
        {rank}
      </Text>
    </View>
    <View style={styles.topInfo}>
      <Text style={[styles.topNombre, { color: colors.text }]} numberOfLines={1}>{nombre}</Text>
      <Text style={[styles.topSub,    { color: colors.textSecondary }]}>
        {unidades} unidades vendidas
      </Text>
    </View>
    <Text style={[styles.topIngreso, { color: '#16A34A' }]}>
      Bs. {parseFloat(ingresos).toFixed(0)}
    </Text>
  </View>
);

const EstadisticasScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();

  const [loading,             setLoading]             = useState(true);
  const [refreshing,          setRefreshing]          = useState(false);
  const [stats,               setStats]               = useState(null);
  const [ventas,              setVentas]              = useState(null);
  const [productos,           setProductos]           = useState(null);
  const [prediccionData,      setPrediccionData]      = useState(null);
  const [error,               setError]               = useState(null);
  const [productosConResenas, setProductosConResenas] = useState([]);
  const [loadingResenas,      setLoadingResenas]      = useState(false);
  const [descargandoExcel,    setDescargandoExcel]    = useState(false);

  // Descarga el reporte Excel del backend y abre el "share sheet" para guardar/enviar
  const descargarExcel = async () => {
    setDescargandoExcel(true);
    try {
      const res = await api.get('/estadisticas/excel', { responseType: 'arraybuffer' });
      // arraybuffer → base64 (Hermes / RN moderno proveen btoa global)
      const bytes = new Uint8Array(res.data);
      let binary = '';
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      const base64 = global.btoa ? global.btoa(binary) : btoa(binary);

      const filename = `naturapiscis-reporte-${new Date().toISOString().slice(0,10)}.xlsx`;
      const fileUri  = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Reporte NaturaPiscis',
          UTI: 'com.microsoft.excel.xlsx',
        });
      } else {
        Alert.alert('Archivo guardado', `Ubicación: ${fileUri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el Excel. Intenta de nuevo.');
    } finally { setDescargandoExcel(false); }
  };
  const [replyState,          setReplyState]          = useState({});
  // Marketing analytics
  const [marketing,           setMarketing]           = useState(null);
  const [marketingLoading,    setMarketingLoading]    = useState(false);
  const [periodoMK,           setPeriodoMK]           = useState('30d');

  const fetchTodo = useCallback(async () => {
    try {
      setError(null);
      // Llamar los 4 endpoints en paralelo
      const [statsRes, ventasRes, productosRes, predRes] = await Promise.allSettled([
        api.get('/estadisticas/productor'),
        api.get('/estadisticas/ventas'),
        api.get('/estadisticas/productos'),
        api.get('/estadisticas/prediccion'),
      ]);

      // Marketing analytics (independiente — se refetcha también al cambiar período)
      try {
        setMarketingLoading(true);
        const mkRes = await api.get(`/estadisticas/marketing?periodo=${periodoMK}`);
        setMarketing(mkRes.data.data || mkRes.data);
      } catch {} finally { setMarketingLoading(false); }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data || statsRes.value.data);
      }
      if (ventasRes.status === 'fulfilled') {
        setVentas(ventasRes.value.data.data || ventasRes.value.data);
      }
      if (productosRes.status === 'fulfilled') {
        setProductos(productosRes.value.data.data || productosRes.value.data);
      }
      if (predRes.status === 'fulfilled') {
        setPrediccionData(predRes.value.data.data || predRes.value.data);
      }

      // Si todos fallaron, mostrar error
      if (statsRes.status === 'rejected' &&
          ventasRes.status === 'rejected' &&
          productosRes.status === 'rejected') {
        setError('No se pudieron cargar las estadísticas');
      }
    } catch (e) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResenas = useCallback(async () => {
    try {
      setLoadingResenas(true);
      const resProd = await api.get('/mis-productos');
      const prods = resProd.data.data || resProd.data || [];
      if (!prods.length) { setProductosConResenas([]); return; }

      const resultados = await Promise.all(
        prods.map(async (p) => {
          try {
            const resOp = await api.get(`/opiniones/producto/${p.id}`);
            const ops = resOp.data.data || [];
            const avg = ops.length ? ops.reduce((s, o) => s + o.calificacion, 0) / ops.length : 0;
            return { id: p.id, nombre: p.nombre, avg, count: ops.length, resenas: ops };
          } catch {
            return { id: p.id, nombre: p.nombre, avg: 0, count: 0, resenas: [] };
          }
        })
      );
      setProductosConResenas(resultados);
    } catch { /* silent */ } finally {
      setLoadingResenas(false);
    }
  }, []);

  const submitRespuesta = useCallback(async (opinionId, texto) => {
    if (!texto?.trim()) return;
    setReplyState(prev => ({ ...prev, [opinionId]: { ...prev[opinionId], loading: true } }));
    try {
      await api.put(`/opiniones/${opinionId}/respuesta`, { respuesta: texto });
      setProductosConResenas(prev => prev.map(p => ({
        ...p,
        resenas: p.resenas.map(r => r.id === opinionId ? { ...r, respuesta: texto.trim() } : r),
      })));
      setReplyState(prev => ({ ...prev, [opinionId]: { open: false, text: '', loading: false } }));
    } catch {
      setReplyState(prev => ({ ...prev, [opinionId]: { ...prev[opinionId], loading: false } }));
    }
  }, []);

  useEffect(() => { fetchTodo(); fetchResenas(); }, [fetchTodo, fetchResenas]);

  // Refetch marketing al cambiar período (sin recargar todo lo demás)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setMarketingLoading(true);
        const r = await api.get(`/estadisticas/marketing?periodo=${periodoMK}`);
        if (!cancel) setMarketing(r.data.data || r.data);
      } catch {} finally { if (!cancel) setMarketingLoading(false); }
    })();
    return () => { cancel = true; };
  }, [periodoMK]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([fetchTodo(), fetchResenas()]);
    setRefreshing(false);
  };

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando estadísticas...
        </Text>
      </View>
    </SafeAreaView>
  );

  if (error && !stats && !ventas && !productos) return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.centered}>
        <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.4 }} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => { setLoading(true); fetchTodo(); }}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // Datos procesados del backend
  const ingresoTotal    = stats?.ventasTotales    || ventas?.ventasTotales    || 0;
  const clientesActivos = stats?.clientesActivos  || 0;
  const produccionTotal = stats?.produccionTotal  || productos?.produccionTotal || 0;
  const totalPedidos    = ventas?.tasaConversion?.total || 0;
  const pedidosEntregados = ventas?.tasaConversion?.completados || 0;

  // Gráfico de ventas mensuales — últimos 7 meses
  const ventasMensuales = (stats?.ventasMensuales || ventas?.ventasMensuales || [])
    .slice(-7)
    .map(v => ({ mes: v.mes?.slice(0, 3) || '', valor: v.valor || 0 }));

  // Top productos
  const topProductos = productos?.productosMasVendidos || [];

  // Estados de pedidos
  const estadosPedidos = ventas?.pedidosPorEstado || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Estadísticas</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Resumen de tu negocio
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={descargarExcel}
            disabled={descargandoExcel}
            style={[styles.refreshBtn, { backgroundColor: '#22c55e22', borderWidth: 1, borderColor: '#22c55e55' }]}
          >
            {descargandoExcel
              ? <ActivityIndicator size="small" color="#22c55e" />
              : <Ionicons name="document-text-outline" size={20} color="#22c55e" />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRefresh}
            style={[styles.refreshBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* ══════════════════════════════════════════════ */}
          {/* ║ MARKETING ANALYTICS                          ║ */}
          {/* ══════════════════════════════════════════════ */}
          <View style={[styles.mkHeader, { borderColor: colors.cardBorder }]}>
            <View style={styles.mkTitleRow}>
              <Ionicons name="flash-outline" size={18} color="#fb923c" />
              <Text style={[styles.mkTitle, { color: colors.text }]}>Marketing Analytics</Text>
            </View>
            <View style={[styles.mkPeriodPill, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              {[
                { k: 'hoy', l: 'Hoy' },
                { k: '7d',  l: '7d'  },
                { k: '30d', l: '30d' },
                { k: '90d', l: '90d' },
                { k: 'año', l: 'Año' },
              ].map(p => (
                <TouchableOpacity key={p.k} onPress={() => setPeriodoMK(p.k)}
                  style={[
                    styles.mkPeriodBtn,
                    periodoMK === p.k && { backgroundColor: colors.primary },
                  ]}>
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: periodoMK === p.k ? '#fff' : colors.textSecondary,
                  }}>{p.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {marketingLoading && !marketing ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : marketing && (
            <>
              {/* KPIs principales con comparación real vs período anterior */}
              <View style={styles.mkKPIGrid}>
                <MKCard D={colors} label="Ingresos" prefix="Bs " value={marketing.metricas.ingresos.actual.toFixed(0)} cambio={marketing.metricas.ingresos.cambio_pct} icon="cash-outline" color="#0ea5e9" />
                <MKCard D={colors} label="Pedidos" value={String(marketing.metricas.pedidos.completados)} cambio={marketing.metricas.pedidos.cambio_pct} icon="cart-outline" color="#22c55e" />
                <MKCard D={colors} label="Ticket prom." prefix="Bs " value={marketing.metricas.ticket_promedio.actual.toFixed(0)} cambio={marketing.metricas.ticket_promedio.cambio_pct} icon="trending-up-outline" color="#a855f7" />
                <MKCard D={colors} label="Clientes" value={String(marketing.metricas.clientes_unicos.actual)} cambio={marketing.metricas.clientes_unicos.cambio_pct} icon="people-outline" color="#fb923c" />
                <MKCard D={colors} label="Conversión" suffix="%" value={String(marketing.metricas.tasa_conversion)} icon="checkmark-circle-outline" color="#22c55e" />
                <MKCard D={colors} label="Cancelación" suffix="%" value={String(marketing.metricas.tasa_cancelacion)} icon="alert-circle-outline" color={marketing.metricas.tasa_cancelacion > 15 ? "#fb923c" : "#3b82f6"} />
              </View>

              {/* Insights automáticos */}
              {marketing.insights?.length > 0 && (
                <View style={[styles.mkInsightsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Ionicons name="bulb-outline" size={15} color="#fb923c" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Recomendaciones para ti</Text>
                  </View>
                  {marketing.insights.map((ins, i) => {
                    const tone = ins.tipo === 'positivo' ? '#22c55e' : ins.tipo === 'alerta' ? '#fb923c' : '#0ea5e9';
                    const bg   = ins.tipo === 'positivo' ? 'rgba(34,197,94,0.08)' : ins.tipo === 'alerta' ? 'rgba(251,146,60,0.08)' : 'rgba(56,189,248,0.08)';
                    const iconMap = {
                      calendar: 'calendar-outline', clock: 'time-outline', alert: 'alert-circle-outline',
                      check: 'checkmark-done-outline', trending_up: 'trending-up-outline',
                      trending_down: 'trending-down-outline', star: 'star-outline', heart: 'heart-outline',
                    };
                    return (
                      <View key={i} style={[styles.mkInsightRow, { backgroundColor: bg, borderColor: tone + '40' }]}>
                        <Ionicons name={iconMap[ins.icono] || 'flash-outline'} size={15} color={tone} />
                        <Text style={{ fontSize: 12, color: colors.text, flex: 1, lineHeight: 17 }}>{ins.texto}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Momentos pico (hora + día) */}
              <View style={styles.mkRow}>
                {marketing.hora_pico && (
                  <View style={[styles.mkPicoCard, { backgroundColor: 'rgba(56,189,248,0.10)', borderColor: 'rgba(56,189,248,0.3)' }]}>
                    <Ionicons name="time-outline" size={22} color="#0ea5e9" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Hora pico</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#0ea5e9' }}>
                        {String(marketing.hora_pico.hora).padStart(2, '0')}:00 – {String((marketing.hora_pico.hora + 1) % 24).padStart(2, '0')}:00
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>{marketing.hora_pico.pedidos} pedidos</Text>
                    </View>
                  </View>
                )}
                {marketing.dia_semana_pico && (
                  <View style={[styles.mkPicoCard, { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.3)' }]}>
                    <Ionicons name="calendar-outline" size={22} color="#22c55e" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Mejor día</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#22c55e' }}>{marketing.dia_semana_pico.dia}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Bs {marketing.dia_semana_pico.ventas.toFixed(0)}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Top clientes */}
              {marketing.top_clientes?.length > 0 && (
                <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    <Ionicons name="trophy-outline" size={16} color="#fb923c" /> Top clientes
                  </Text>
                  {marketing.top_clientes.map((c, i) => (
                    <View key={c.id} style={[styles.mkClienteRow, i < marketing.top_clientes.length - 1 && { borderBottomWidth: 1, borderColor: colors.cardBorder }]}>
                      <View style={[styles.mkClienteRank, i === 0 && { backgroundColor: '#fbbf24' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: i === 0 ? '#fff' : colors.textSecondary }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>{c.nombre}</Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Bs {c.gastado.toFixed(0)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Funnel de reservas */}
              {marketing.funnel_reservas?.creadas > 0 && (
                <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Ionicons name="funnel-outline" size={15} color="#a855f7" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Funnel de reservas</Text>
                  </View>
                  {[
                    { l: 'Creadas',    v: marketing.funnel_reservas.creadas,    c: '#0ea5e9' },
                    { l: 'Aceptadas',  v: marketing.funnel_reservas.aceptadas,  c: '#22c55e' },
                    { l: 'Rechazadas', v: marketing.funnel_reservas.rechazadas, c: '#ef4444' },
                    { l: 'Expiradas',  v: marketing.funnel_reservas.expiradas,  c: '#fb923c' },
                  ].map(row => {
                    const pct = (row.v / marketing.funnel_reservas.creadas) * 100;
                    return (
                      <View key={row.l} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{row.l}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>{row.v}</Text>
                        </View>
                        <View style={{ height: 5, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' }}>
                          <View style={{ height: '100%', width: `${pct}%`, backgroundColor: row.c }} />
                        </View>
                      </View>
                    );
                  })}
                  <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                    Tasa de aceptación: <Text style={{ color: '#22c55e', fontWeight: '700' }}>{marketing.funnel_reservas.tasa_aceptacion}%</Text>
                  </Text>
                </View>
              )}

              {/* Separador visual entre Marketing y Vista anual */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 8 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>VISTA ANUAL</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
              </View>
            </>
          )}

          {/* ── Métricas principales ── */}
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="cash-outline"
              label="Ingresos totales"
              value={`Bs. ${parseFloat(ingresoTotal).toFixed(0)}`}
              color="#16A34A"
              bg="#f0fdfa"
            />
            <MetricCard
              icon="cart-outline"
              label="Pedidos"
              value={String(totalPedidos)}
              sub={`${pedidosEntregados} entregados`}
              color="#3b82f6"
              bg="#eff6ff"
            />
            <MetricCard
              icon="cube-outline"
              label="Stock total"
              value={`${produccionTotal} kg`}
              color="#8b5cf6"
              bg="#f5f3ff"
            />
            <MetricCard
              icon="people-outline"
              label="Clientes únicos"
              value={String(clientesActivos)}
              color="#eab308"
              bg="#fefce8"
            />
          </View>

          {/* ── Gráfico ventas mensuales ── */}
          {ventasMensuales.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Ingresos mensuales
                </Text>
                <Text style={[styles.chartTotal, { color: '#16A34A' }]}>
                  Bs. {parseFloat(ingresoTotal).toFixed(0)}
                </Text>
              </View>
              <BarChart data={ventasMensuales} color="#16A34A" isDark={isDarkMode} />
            </View>
          )}

          {/* ── Tasa de conversión ── */}
          {ventas?.tasaConversion && (
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 12 }]}>
                Tasa de conversión
              </Text>
              <View style={styles.tasaRow}>
                <View style={[styles.tasaBox, { backgroundColor: '#f0fdf4' }]}>
                  <Text style={[styles.tasaNum, { color: '#22c55e' }]}>
                    {ventas.tasaConversion.porcentaje}%
                  </Text>
                  <Text style={styles.tasaLabel}>Completados</Text>
                </View>
                <View style={[styles.tasaBox, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.tasaNum, { color: '#ef4444' }]}>
                    {ventas.tasaConversion.cancelados}
                  </Text>
                  <Text style={styles.tasaLabel}>Cancelados</Text>
                </View>
                <View style={[styles.tasaBox, { backgroundColor: '#eff6ff' }]}>
                  <Text style={[styles.tasaNum, { color: '#3b82f6' }]}>
                    {ventas.tasaConversion.total}
                  </Text>
                  <Text style={styles.tasaLabel}>Total</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Top productos ── */}
          {topProductos.length > 0 && (
            <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="trophy-outline" size={16} color="#eab308" /> Top productos
              </Text>
              {topProductos.slice(0, 5).map((p, i) => (
                <TopProducto
                  key={p.id || i}
                  rank={i + 1}
                  nombre={p.nombre}
                  unidades={p.unidades_vendidas || p.total_vendido || 0}
                  ingresos={p.ingresos_generados || 0}
                  colors={colors}
                />
              ))}
            </View>
          )}

          {/* ── Estados de pedidos ── */}
          {estadosPedidos.length > 0 && (
            <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="pie-chart-outline" size={16} color={colors.primary} /> Estado de pedidos
              </Text>
              {estadosPedidos.map((e, i) => {
                const total = estadosPedidos.reduce((a, b) => a + parseInt(b.cantidad || 0), 0);
                const pct   = total > 0 ? Math.round((parseInt(e.cantidad) / total) * 100) : 0;
                const colorMap = {
                  entregado:          '#22c55e',
                  en_camino:          '#22C55E',
                  preparando:         '#8b5cf6',
                  listo_para_recoger: '#f97316',
                  confirmado:         '#3b82f6',
                  pendiente:          '#f59e0b',
                  cancelado:          '#ef4444',
                };
                const c = colorMap[e.estado] || colors.primary;
                return (
                  <View key={i} style={styles.estadoRow}>
                    <View style={[styles.estadoDot, { backgroundColor: c }]} />
                    <Text style={[styles.estadoLabel, { color: colors.text }]}>
                      {e.estado?.replace(/_/g, ' ')}
                    </Text>
                    <View style={[styles.estadoBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.estadoBarFill, { width: `${pct}%`, backgroundColor: c }]} />
                    </View>
                    <Text style={[styles.estadoCount, { color: colors.textSecondary }]}>
                      {e.cantidad}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Módulo C: Predicción de Ventas ── */}
          <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                <Ionicons name="trending-up-outline" size={15} color="#8b5cf6" /> Predicción de Ventas
              </Text>
            </View>

            {!prediccionData ? (
              <ActivityIndicator size="small" color="#8b5cf6" style={{ marginVertical: 20 }} />
            ) : prediccionData.mensaje ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>
                {prediccionData.mensaje}
              </Text>
            ) : (
              <>
                {/* Métricas del modelo */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={styles.predBadge}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Modelo</Text>
                    <Text style={{ fontSize: 11, color: '#8b5cf6', fontWeight: '700', fontFamily: 'monospace' }}>
                      {prediccionData.modelo}
                    </Text>
                  </View>
                  <View style={[styles.predBadge, { marginLeft: 8 }]}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>R²</Text>
                    <Text style={{ fontSize: 14, color: '#38bdf8', fontWeight: '800' }}>
                      {prediccionData.r2?.toFixed(3)}
                    </Text>
                  </View>
                  <View style={[styles.predBadge, { marginLeft: 8 }]}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>RMSE</Text>
                    <Text style={{ fontSize: 14, color: '#38bdf8', fontWeight: '800' }}>
                      Bs. {prediccionData.rmse?.toFixed(1)}
                    </Text>
                  </View>
                </ScrollView>

                {/* Gráfico */}
                <PredictionLineChart
                  historico={prediccionData.historico || []}
                  prediccion={prediccionData.prediccion || []}
                  isDark={isDarkMode}
                />

                {/* Leyenda */}
                <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 20, height: 2, backgroundColor: '#38bdf8' }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Histórico</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 20, height: 2, backgroundColor: '#8b5cf6', borderStyle: 'dashed', borderWidth: 1 }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Proyección</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 14, height: 10, backgroundColor: 'rgba(139,92,246,0.18)', borderRadius: 2 }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>IC 95%</Text>
                  </View>
                </View>

                {/* Tabla de proyección */}
                {(prediccionData.prediccion || []).length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <View style={[styles.predTableRow, { backgroundColor: colors.background }]}>
                      <Text style={[styles.predTH, { color: colors.textSecondary, flex: 1.2 }]}>Mes</Text>
                      <Text style={[styles.predTH, { color: colors.textSecondary }]}>Proyect. (Bs)</Text>
                      <Text style={[styles.predTH, { color: colors.textSecondary }]}>Mín</Text>
                      <Text style={[styles.predTH, { color: colors.textSecondary }]}>Máx</Text>
                    </View>
                    {prediccionData.prediccion.map((p, i) => (
                      <View key={i} style={[styles.predTableRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                        <Text style={[styles.predTD, { color: '#8b5cf6', fontWeight: '700', flex: 1.2 }]}>{p.mes}</Text>
                        <Text style={[styles.predTD, { color: colors.text, fontWeight: '700' }]}>{p.valor.toLocaleString('es-BO')}</Text>
                        <Text style={[styles.predTD, { color: colors.textSecondary }]}>{p.lower.toLocaleString('es-BO')}</Text>
                        <Text style={[styles.predTD, { color: colors.textSecondary }]}>{p.upper.toLocaleString('es-BO')}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── Reseñas de tus Productos ── */}
          <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                <Ionicons name="star" size={15} color="#F59E0B" /> Reseñas de tus Productos
              </Text>
              {loadingResenas && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {!loadingResenas && productosConResenas.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                Aún no tienes reseñas en tus productos
              </Text>
            ) : (
              <>
                {/* Tarjetas por producto */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {productosConResenas.map(p => (
                    <View key={p.id} style={[styles.ratingCard, { backgroundColor: colors.background }]}>
                      <Text numberOfLines={1} style={[styles.ratingName, { color: colors.text }]}>{p.nombre}</Text>
                      <View style={styles.starsRow}>
                        {[1,2,3,4,5].map(s => (
                          <Ionicons key={s}
                            name={s <= Math.round(p.avg) && p.count > 0 ? 'star' : 'star-outline'}
                            size={12} color="#F59E0B" />
                        ))}
                      </View>
                      <Text style={[styles.ratingAvg, { color: p.count > 0 ? '#F59E0B' : colors.textSecondary }]}>
                        {p.count > 0 ? p.avg.toFixed(1) : '—'}
                      </Text>
                      <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                        {p.count} reseña{p.count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Comentarios recientes */}
                {(() => {
                  const todas = productosConResenas
                    .flatMap(p => p.resenas.map(r => ({ ...r, producto_nombre: p.nombre })))
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .slice(0, 5);
                  if (!todas.length) return (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
                      Sin comentarios todavía
                    </Text>
                  );
                  return todas.map((r, i) => (
                    <View key={r.id} style={[
                      styles.reviewRow,
                      i < todas.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                    ]}>
                      <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + '20' }]}>
                        {r.foto_perfil
                          ? <Image source={{ uri: r.foto_perfil }} style={styles.reviewAvatarImg} />
                          : <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
                              {r.usuario_nombre?.[0]?.toUpperCase()}
                            </Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{r.usuario_nombre}</Text>
                          <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                            {new Date(r.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3 }}>
                          sobre {r.producto_nombre}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 2, marginBottom: r.comentario ? 3 : 0 }}>
                          {[1,2,3,4,5].map(s => (
                            <Ionicons key={s}
                              name={s <= r.calificacion ? 'star' : 'star-outline'}
                              size={11} color="#F59E0B" />
                          ))}
                        </View>
                        {r.comentario ? (
                          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>{r.comentario}</Text>
                        ) : null}
                        {r.respuesta ? (
                          <View style={{ marginTop: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.primary, marginLeft: 2 }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: 2 }}>Tu respuesta:</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{r.respuesta}</Text>
                          </View>
                        ) : replyState[r.id]?.open ? (
                          <View style={{ marginTop: 8 }}>
                            <TextInput
                              value={replyState[r.id]?.text || ''}
                              onChangeText={t => setReplyState(prev => ({ ...prev, [r.id]: { ...prev[r.id], text: t } }))}
                              placeholder="Escribe tu respuesta..."
                              placeholderTextColor={colors.textSecondary}
                              multiline numberOfLines={2} maxLength={400}
                              style={{ borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 8, fontSize: 12, color: colors.text, backgroundColor: colors.background, marginBottom: 6 }}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity
                                onPress={() => submitRespuesta(r.id, replyState[r.id]?.text)}
                                disabled={replyState[r.id]?.loading || !replyState[r.id]?.text?.trim()}
                                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primary, opacity: replyState[r.id]?.loading ? 0.6 : 1 }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                                  {replyState[r.id]?.loading ? 'Enviando…' : 'Publicar'}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => setReplyState(prev => ({ ...prev, [r.id]: { open: false, text: '', loading: false } }))}
                                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cancelar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => setReplyState(prev => ({ ...prev, [r.id]: { open: true, text: '', loading: false } }))}
                            style={{ marginTop: 4 }}>
                            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>+ Responder</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ));
                })()}
              </>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  centered:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:      { fontSize: 14 },
  errorTitle:       { fontSize: 16, fontWeight: '600' },
  retryBtn:         { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText:        { color: '#fff', fontWeight: '600' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn:          { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:      { fontSize: 22, fontWeight: 'bold' },
  headerSub:        { fontSize: 12, marginTop: 2 },
  refreshBtn:       { padding: 8, borderRadius: 10 },
  scroll:           { flex: 1 },
  content:          { padding: SPACING.lg, gap: SPACING.md, paddingTop: 4, paddingBottom: 40 },
  metricsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard:       { width: (width - 48 - 10) / 2, borderRadius: BORDER_RADIUS.lg, padding: 14, gap: 4 },
  metricIcon:       { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  metricValue:      { fontSize: 20, fontWeight: '800' },
  metricLabel:      { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  metricSub:        { fontSize: 10, color: '#9ca3af' },
  chartCard:        { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  chartHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartTitle:       { fontSize: 14, fontWeight: '600' },
  chartTotal:       { fontSize: 14, fontWeight: '700' },
  tasaRow:          { flexDirection: 'row', gap: 10 },
  tasaBox:          { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  tasaNum:          { fontSize: 22, fontWeight: '800' },
  tasaLabel:        { fontSize: 11, color: '#6b7280', marginTop: 2 },
  topCard:          { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  sectionTitle:     { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  topRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  topRank:          { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  topRankText:      { fontSize: 12, fontWeight: '700' },
  topInfo:          { flex: 1 },
  topNombre:        { fontSize: 13, fontWeight: '500' },
  topSub:           { fontSize: 11, marginTop: 1 },
  topIngreso:       { fontSize: 13, fontWeight: '700' },

  // ── Marketing Analytics ─────────────────────────────
  mkHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 },
  mkTitleRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mkTitle:          { fontSize: 15, fontWeight: '700' },
  mkPeriodPill:     { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 2 },
  mkPeriodBtn:      { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
  mkKPIGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  mkCard:           { width: (width - 48 - 16) / 3, borderWidth: 1, borderRadius: 10, padding: 9, gap: 4 },
  mkCardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mkCardLabel:      { fontSize: 10, fontWeight: '600', flex: 1, marginRight: 4 },
  mkCardIcon:       { width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  mkCardValue:      { fontSize: 14, fontWeight: '800' },
  mkInsightsCard:   { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  mkInsightRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  mkRow:            { flexDirection: 'row', gap: 10, marginBottom: 14 },
  mkPicoCard:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  mkClienteRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  mkClienteRank:    { width: 22, height: 22, borderRadius: 11, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },

  estadoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  estadoDot:        { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  estadoLabel:      { fontSize: 12, width: 110, textTransform: 'capitalize' },
  estadoBar:        { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  estadoBarFill:    { height: '100%', borderRadius: 3 },
  estadoCount:      { fontSize: 12, fontWeight: '600', width: 24, textAlign: 'right' },

  predBadge:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', alignItems: 'center', gap: 2 },
  predTableRow:     { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 4 },
  predTH:           { flex: 1, fontSize: 10, fontWeight: '600', textAlign: 'right' },
  predTD:           { flex: 1, fontSize: 11, textAlign: 'right' },

  ratingCard:       { width: 120, borderRadius: 10, padding: 12, marginRight: 10, gap: 3 },
  ratingName:       { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  starsRow:         { flexDirection: 'row', gap: 1 },
  ratingAvg:        { fontSize: 22, fontWeight: '800', marginTop: 2 },
  ratingCount:      { fontSize: 11 },
  reviewRow:        { flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'flex-start' },
  reviewAvatar:     { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },
  reviewAvatarImg:  { width: 34, height: 34, borderRadius: 17 },
  reviewAvatarText: { fontSize: 13, fontWeight: '700' },
});

export default EstadisticasScreen;