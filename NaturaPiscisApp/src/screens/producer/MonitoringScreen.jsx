// ============================================================
// src/screens/producer/MonitoringScreen.jsx
// Monitoreo IoT con gráficos históricos + IA predictiva
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Switch, Dimensions, ActivityIndicator,
  Animated, Easing, TextInput, Alert, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line, Text as SvgText, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLagunas } from '../../hooks/useLagunas';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../../components/common/Loading';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { SENSOR_COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CHART_WIDTH  = width - 48;
const CHART_HEIGHT = 160;
const CHART_PAD    = { top: 10, right: 16, bottom: 28, left: 36 };

// ── Configuración de sensores ──────────────────────────────────
const SENSOR_CFG = {
  temperatura: { label: 'Temperatura', unit: '°C',  color: SENSOR_COLORS.temperatura.primary, gradId: 'gTemp', min: 25, max: 34, optMin: 27, optMax: 32 },
  ph:          { label: 'pH',          unit: '',    color: SENSOR_COLORS.ph.primary,           gradId: 'gPh',   min: 6.5, max: 8.5, optMin: 7.0, optMax: 7.8 },
  turbidez:    { label: 'Turbidez',    unit: ' NTU',color: SENSOR_COLORS.turbidez.primary,     gradId: 'gTurb', min: 0,   max: 80,  optMin: 5,   optMax: 30 },
};

const TIME_TABS = [
  { key: '1h',  label: '1h'  },
  { key: '24h', label: '24h' },
  { key: '7d',  label: '7d'  },
];

// ── Generar historial simulado ─────────────────────────────────
const generateHistory = (currentVal, sensorKey, range) => {
  const cfg   = SENSOR_CFG[sensorKey];
  const counts = { '1h': 20, '24h': 48, '7d': 56 };
  const n     = counts[range] || 48;
  const base  = currentVal || (cfg.min + cfg.max) / 2;
  return Array.from({ length: n }, (_, i) => {
    const noise = (Math.random() - 0.5) * (cfg.max - cfg.min) * 0.12;
    const trend = Math.sin(i / n * Math.PI * 2) * (cfg.max - cfg.min) * 0.04;
    return Math.max(cfg.min * 0.9, Math.min(cfg.max * 1.1, base + noise + trend));
  });
};

// ── Mini gráfico SVG ───────────────────────────────────────────
const MiniChart = ({ data, cfg, isDark }) => {
  if (!data || data.length < 2) return null;
  const w = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const h = CHART_HEIGHT - CHART_PAD.top  - CHART_PAD.bottom;

  const minV = Math.min(...data) * 0.97;
  const maxV = Math.max(...data) * 1.03;
  const scX  = (i) => CHART_PAD.left + (i / (data.length - 1)) * w;
  const scY  = (v) => CHART_PAD.top + h - ((v - minV) / (maxV - minV || 1)) * h;

  // Polyline path
  const pts  = data.map((v, i) => `${scX(i)},${scY(v)}`).join(' ');
  const area = `M${scX(0)},${scY(data[0])} ` +
    data.map((v, i) => `L${scX(i)},${scY(v)}`).join(' ') +
    ` L${scX(data.length-1)},${CHART_PAD.top + h} L${scX(0)},${CHART_PAD.top + h} Z`;

  // Rango óptimo en Y
  const optMinY = scY(Math.min(cfg.optMax, maxV));
  const optMaxY = scY(Math.max(cfg.optMin, minV));
  const optH    = Math.max(0, optMaxY - optMinY);

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#f3f4f6';

  // Labels eje Y (3 valores)
  const yLabels = [minV, (minV + maxV) / 2, maxV].map(v => ({
    val: v.toFixed(1),
    y:   scY(v),
  }));

  // Labels eje X (primero, medio, último)
  const xIdxs = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id={cfg.gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={cfg.color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={cfg.color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {yLabels.map((l, i) => (
        <Line key={i} x1={CHART_PAD.left} y1={l.y} x2={CHART_PAD.left + w} y2={l.y}
          stroke={gridColor} strokeWidth="1" />
      ))}

      {/* Zona óptima */}
      <Rect x={CHART_PAD.left} y={optMinY} width={w} height={optH}
        fill="#22c55e" opacity="0.08" />

      {/* Área rellena */}
      <Path d={area} fill={`url(#${cfg.gradId})`} />

      {/* Línea */}
      <Path d={`M${pts.split(' ').map((p,i) => (i===0?'M':'L')+p).join(' ')}`}
        stroke={cfg.color} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Punto actual (último) */}
      <Circle
        cx={scX(data.length - 1)} cy={scY(data[data.length - 1])}
        r="4" fill={cfg.color} />

      {/* Eje Y labels */}
      {yLabels.map((l, i) => (
        <SvgText key={i} x={CHART_PAD.left - 4} y={l.y + 4}
          fontSize="9" fill={textColor} textAnchor="end">{l.val}</SvgText>
      ))}
    </Svg>
  );
};

// ── Gauge de riesgo ────────────────────────────────────────────
const RiskGauge = ({ score, label, colors }) => {
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e';
  const levelLabel = score >= 75 ? 'Crítico' : score >= 50 ? 'Alto' : score >= 25 ? 'Moderado' : 'Bajo';
  return (
    <View style={[styles.gaugeBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <Text style={[styles.gaugeLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.gaugeBarContainer}>
        <View style={[styles.gaugeBarBg, { backgroundColor: colors.border }]}>
          <View style={[styles.gaugeBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.gaugeScore, { color }]}>{score}</Text>
      </View>
      <Text style={[styles.gaugeLevelText, { color }]}>{levelLabel}</Text>
    </View>
  );
};

// ── Algoritmo de predicción ────────────────────────────────────
const predict = (history, hoursAhead) => {
  if (!history || history.length < 3) return null;
  const n = history.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  history.forEach((v, i) => { sumX += i; sumY += v; sumXY += i * v; sumX2 += i * i; });
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  const stepsPerHour = (5 / 60);
  const steps = hoursAhead / stepsPerHour;
  return parseFloat((slope * (n - 1 + steps) + intercept).toFixed(2));
};

const riskFn = (key, val) => {
  const cfg = SENSOR_CFG[key];
  if (!val) return 0;
  if (val > cfg.max * 1.06 || val < cfg.min * 0.94) return 100;
  if (val > cfg.max || val < cfg.min) return 75;
  if (val > cfg.optMax || val < cfg.optMin) return 30;
  return 0;
};

const calcRisk = (currentVals, histMap) => {
  const weights = { temperatura: 0.40, ph: 0.35, turbidez: 0.25 };
  let score2h = 0, score4h = 0;
  const breakdown = {};
  Object.entries(weights).forEach(([key, w]) => {
    const hist = histMap[key] || [];
    const p2h = predict(hist, 2) ?? currentVals[key];
    const p4h = predict(hist, 4) ?? currentVals[key];
    score2h += riskFn(key, p2h) * w;
    score4h += riskFn(key, p4h) * w;
    breakdown[key] = { p2h, p4h };
  });
  return { score2h: Math.round(score2h), score4h: Math.round(score4h), breakdown };
};

const getRecommendations = (currentVals) => {
  const recs = [];
  const t = currentVals.temperatura;
  const p = currentVals.ph;
  const tr = currentVals.turbidez;
  if (t > 33) recs.push({ icon: 'thermometer-outline', text: 'Activar aireación — temperatura en ascenso', color: '#ef4444' });
  if (t < 26) recs.push({ icon: 'snow-outline',        text: 'Temperatura baja — cubre el estanque',       color: '#3b82f6' });
  if (p < 6.5) recs.push({ icon: 'flask-outline',      text: 'pH ácido — aplicar cal agrícola',            color: '#f97316' });
  if (p > 8.5) recs.push({ icon: 'flask-outline',      text: 'pH alcalino — recambio parcial de agua',     color: '#f97316' });
  if (tr > 60) recs.push({ icon: 'eye-outline',        text: 'Turbidez alta — revisar filtros',            color: '#8b5cf6' });
  if (recs.length === 0) recs.push({ icon: 'checkmark-circle-outline', text: 'Sistema estable — todo en rango óptimo', color: '#22c55e' });
  return recs;
};

// ── Punto de estado animado (header) ──────────────────────────
const AnimatedStatusDot = ({ isConnected }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1.6, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1,   duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 900, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      scale.setValue(1);
      opacity.setValue(1);
    }
    return () => { scale.stopAnimation(); opacity.stopAnimation(); };
  }, [isConnected]);

  return (
    <Animated.View style={[
      styles.statusDot,
      { backgroundColor: isConnected ? '#00E676' : '#FF5370' },
      { transform: [{ scale }], opacity },
    ]} />
  );
};

// ── Gauge circular animado ────────────────────────────────────
const GAUGE_SIZE   = Math.floor((width - SPACING.lg * 2 - SPACING.md) / 3);
const GAUGE_STROKE = Math.max(7, Math.floor(GAUGE_SIZE * 0.085));
const GAUGE_CX     = GAUGE_SIZE / 2;
const GAUGE_CY     = GAUGE_SIZE / 2;
const GAUGE_R      = (GAUGE_SIZE - GAUGE_STROKE * 2 - 2) / 2;
const GAUGE_CIRC   = 2 * Math.PI * GAUGE_R;
const GAUGE_ARC    = GAUGE_CIRC * 0.75; // arco de 270°
const GAUGE_GAP    = GAUGE_CIRC - GAUGE_ARC;

const SensorGauge = ({ value, unit, label, color, min, max, optMin, optMax, sensorIcon, isAlert }) => {
  const gaugeColor = isAlert ? '#FF5370' : color;
  const pct        = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const [arcFill, setArcFill] = useState(0);
  const animRef    = useRef(null);
  const targetArc  = (pct / 100) * GAUGE_ARC;

  useEffect(() => {
    const start    = Date.now();
    const duration = 950;
    const animate  = () => {
      const t     = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setArcFill(targetArc * eased);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [targetArc]);

  const valFontSize  = Math.min(19, Math.floor(GAUGE_SIZE * 0.185));
  const unitFontSize = Math.min(10, Math.floor(GAUGE_SIZE * 0.095));
  const displayUnit  = unit.trim() || 'pH';

  return (
    <View style={styles.gaugeItem}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        {/* Pista (track) */}
        <Circle
          cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
          fill="none"
          stroke="rgba(0,212,255,0.10)"
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${GAUGE_ARC} ${GAUGE_GAP}`}
          strokeLinecap="round"
          transform={`rotate(135, ${GAUGE_CX}, ${GAUGE_CY})`}
        />
        {/* Progreso */}
        <Circle
          cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${arcFill} ${GAUGE_CIRC - arcFill}`}
          strokeLinecap="round"
          transform={`rotate(135, ${GAUGE_CX}, ${GAUGE_CY})`}
        />
        {/* Valor */}
        <SvgText
          x={GAUGE_CX}
          y={GAUGE_CY + Math.floor(valFontSize * 0.35)}
          fontSize={valFontSize}
          fontWeight="700"
          fill={isAlert ? '#FF5370' : '#E8F0FF'}
          textAnchor="middle"
        >
          {value?.toFixed(1) ?? '--'}
        </SvgText>
        {/* Unidad */}
        <SvgText
          x={GAUGE_CX}
          y={GAUGE_CY + Math.floor(valFontSize * 0.35) + unitFontSize + 3}
          fontSize={unitFontSize}
          fill="#8BA5C8"
          textAnchor="middle"
        >
          {displayUnit}
        </SvgText>
      </Svg>
      <View style={styles.gaugeLabelRow}>
        <Ionicons name={sensorIcon} size={12} color={gaugeColor} />
        <Text style={[styles.gaugeSensorLabel, { color: gaugeColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.gaugeOptRange} numberOfLines={1}>
        {optMin}–{optMax}{unit.trim() ? (' ' + unit.trim()) : ''}
      </Text>
    </View>
  );
};

// ── Pantalla principal ─────────────────────────────────────────
const MonitoringScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { lagunasArray, isConnected, isLoading, alerts, lastUpdate, controlBomba, vincularCodigo, refresh } = useLagunas();

  const [refreshing, setRefreshing]       = useState(false);
  const [timeRange, setTimeRange]         = useState('24h');
  const [historyMap, setHistoryMap]       = useState({});
  const [activeTab, setActiveTab]         = useState('sensores');
  const [selectedId, setSelectedId]       = useState(null);
  const [codigoInput, setCodigoInput]     = useState('');
  const [vinculando, setVinculando]       = useState(false);
  const [showCodigo, setShowCodigo]       = useState(false);

  // Laguna seleccionada (por defecto la primera)
  const laguna = lagunasArray.find(l => l.id === selectedId) || lagunasArray[0] || null;

  useEffect(() => {
    if (lagunasArray.length && !selectedId) {
      setSelectedId(lagunasArray[0].id);
    }
  }, [lagunasArray]);

  // Extraer valores actuales
  const currentVals = {};
  if (laguna?.sensors) {
    laguna.sensors.forEach(s => { currentVals[s.type] = parseFloat(s.value); });
  }

  useEffect(() => {
    if (!laguna) return;
    const map = {};
    Object.keys(SENSOR_CFG).forEach(key => {
      map[key] = generateHistory(currentVals[key] || 0, key, timeRange);
    });
    setHistoryMap(map);
  }, [laguna?.id, timeRange]);

  const risk = calcRisk(currentVals, historyMap);
  const recommendations = getRecommendations(currentVals);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBomba = async () => {
    if (!laguna) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await controlBomba(laguna.id, !laguna.bomba);
  };

  const handleVincular = async () => {
    if (!codigoInput.trim() || !laguna) return;
    setVinculando(true);
    try {
      await vincularCodigo(laguna.id, codigoInput.trim());
      setCodigoInput('');
      setShowCodigo(false);
      Alert.alert('✅ Vinculado', `Sensor "${codigoInput.trim().toUpperCase()}" conectado a ${laguna.nombre}`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo vincular el dispositivo');
    } finally {
      setVinculando(false);
    }
  };

  // ── Render tabs ──────────────────────────────────────────────
  const renderTabs = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {[
        { key: 'sensores', icon: 'pulse-outline',      label: 'En vivo'   },
        { key: 'graficos', icon: 'bar-chart-outline',  label: 'Gráficos'  },
        { key: 'ia',       icon: 'brain-outline',      label: 'IA Riesgo' },
      ].map(tab => (
        <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab(tab.key)}>
          <Ionicons name={tab.icon} size={18} color={activeTab === tab.key ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.textSecondary }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Tab: Sensores en vivo ────────────────────────────────────
  const renderSensores = () => (
    <View style={styles.sectionContent}>
      {/* Alertas */}
      {alerts.length > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: colors.errorBg, borderColor: colors.error + '40' }]}>
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <Text style={[styles.alertText, { color: colors.error }]}>
            {alerts.length} alerta{alerts.length > 1 ? 's' : ''} activa{alerts.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Gauges circulares */}
      {laguna?.sensors && (
        <View style={[styles.gaugesCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.gaugesRow}>
            {laguna.sensors.map(sensor => {
              const cfg = SENSOR_CFG[sensor.type];
              if (!cfg) return null;
              return (
                <SensorGauge
                  key={sensor.id}
                  value={parseFloat(sensor.value)}
                  unit={cfg.unit}
                  label={cfg.label}
                  color={cfg.color}
                  min={cfg.min}
                  max={cfg.max}
                  optMin={cfg.optMin}
                  optMax={cfg.optMax}
                  sensorIcon={
                    sensor.type === 'temperatura' ? 'thermometer-outline' :
                    sensor.type === 'ph'          ? 'flask-outline'        :
                                                    'eye-outline'
                  }
                  isAlert={sensor.status === 'critical' || sensor.status === 'warning'}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Control bomba */}
      {laguna && (
        <View style={[styles.bombaCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.bombaRow}>
            <Ionicons name="water-outline" size={22} color={laguna.bomba ? colors.secondary : colors.textSecondary} />
            <View style={styles.bombaInfo}>
              <Text style={[styles.bombaTitle, { color: colors.text }]}>Bomba de agua</Text>
              <Text style={[styles.bombaStatus, { color: laguna.bomba ? colors.secondary : colors.textSecondary }]}>
                {laguna.bomba ? 'Activa' : 'Apagada'}
              </Text>
            </View>
            <Switch value={laguna.bomba || false} onValueChange={handleBomba}
              trackColor={{ false: colors.border, true: colors.secondary + '60' }}
              thumbColor={laguna.bomba ? colors.secondary : colors.textSecondary} />
          </View>
        </View>
      )}
    </View>
  );

  // ── Tab: Gráficos históricos ─────────────────────────────────
  const renderGraficos = () => (
    <View style={styles.sectionContent}>
      {/* Selector de rango */}
      <View style={[styles.rangePicker, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {TIME_TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.rangeTab, timeRange === t.key && { backgroundColor: colors.primary + '20' }]}
            onPress={() => setTimeRange(t.key)}>
            <Text style={[styles.rangeTabText, { color: timeRange === t.key ? colors.primary : colors.textSecondary }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {Object.entries(SENSOR_CFG).map(([key, cfg]) => (
        <View key={key} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.chartHeader}>
            <View style={[styles.chartDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>{cfg.label}</Text>
            <Text style={[styles.chartCurrent, { color: cfg.color }]}>
              {currentVals[key]?.toFixed(1) || '--'}{cfg.unit}
            </Text>
          </View>
          <MiniChart data={historyMap[key] || []} cfg={cfg} isDark={isDarkMode} />
          <Text style={[styles.chartFooter, { color: colors.textSecondary }]}>
            Óptimo: {cfg.optMin}–{cfg.optMax}{cfg.unit}
            {'  '}· Seguro: {cfg.min}–{cfg.max}{cfg.unit}
          </Text>
        </View>
      ))}
    </View>
  );

  // ── Tab: IA Predictiva ───────────────────────────────────────
  const renderIA = () => (
    <View style={styles.sectionContent}>
      {/* Header */}
      <View style={[styles.iaHeader, { backgroundColor: '#7c3aed' + '15', borderColor: '#7c3aed' + '30' }]}>
        <Ionicons name="brain-outline" size={22} color="#7c3aed" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.iaTitle, { color: colors.text }]}>Predicción de riesgo de mortalidad</Text>
          <Text style={[styles.iaSub, { color: colors.textSecondary }]}>
            Regresión lineal · Temp 40% · pH 35% · Turbidez 25%
          </Text>
        </View>
      </View>

      {/* Gauges */}
      <View style={styles.gaugesRow}>
        <RiskGauge score={risk.score2h} label="+2 horas" colors={colors} />
        <RiskGauge score={risk.score4h} label="+4 horas" colors={colors} />
      </View>

      {/* Proyecciones por parámetro */}
      <View style={[styles.projCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.projTitle, { color: colors.text }]}>Valores proyectados</Text>
        {Object.entries(SENSOR_CFG).map(([key, cfg]) => {
          const bd = risk.breakdown[key] || {};
          return (
            <View key={key} style={styles.projRow}>
              <View style={[styles.projDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.projLabel, { color: colors.text }]}>{cfg.label}</Text>
              <Text style={[styles.projVal, { color: colors.textSecondary }]}>
                Ahora: <Text style={{ color: cfg.color }}>{currentVals[key]?.toFixed(1) || '--'}{cfg.unit}</Text>
              </Text>
              <Text style={[styles.projVal, { color: colors.textSecondary }]}>
                +2h: <Text style={{ color: cfg.color }}>{bd.p2h?.toFixed(1) || '--'}{cfg.unit}</Text>
              </Text>
              <Text style={[styles.projVal, { color: colors.textSecondary }]}>
                +4h: <Text style={{ color: cfg.color }}>{bd.p4h?.toFixed(1) || '--'}{cfg.unit}</Text>
              </Text>
            </View>
          );
        })}
      </View>

      {/* Recomendaciones */}
      <View style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.projTitle, { color: colors.text }]}>Recomendaciones</Text>
        {recommendations.map((r, i) => (
          <View key={i} style={[styles.recRow, { borderBottomColor: colors.border, borderBottomWidth: i < recommendations.length - 1 ? 1 : 0 }]}>
            <Ionicons name={r.icon} size={18} color={r.color} />
            <Text style={[styles.recText, { color: colors.text }]}>{r.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Loading / Sin conexión ────────────────────────────────────
  if (isLoading && !laguna) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Conectando a sensores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Monitoreo IoT</Text>
          <View style={styles.headerStatus}>
            <AnimatedStatusDot isConnected={isConnected} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {isConnected ? `En línea · ${lastUpdate ? new Date(lastUpdate).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : ''}` : 'Sin conexión'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Selector de lagunas (si hay más de una) */}
      {lagunasArray.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16, marginBottom: 8 }}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {lagunasArray.map(l => (
            <TouchableOpacity key={l.id}
              onPress={() => setSelectedId(l.id)}
              style={[styles.lagunaChip,
                { backgroundColor: selectedId === l.id ? colors.primary : colors.surface,
                  borderColor: selectedId === l.id ? colors.primary : colors.border }]}>
              <View style={[styles.chipDot, { backgroundColor: l.conectado ? '#22c55e' : '#6b7280' }]} />
              <Text style={[styles.chipText, { color: selectedId === l.id ? '#fff' : colors.text }]}>
                {l.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Panel código de dispositivo */}
      {laguna && (
        <TouchableOpacity
          onPress={() => setShowCodigo(!showCodigo)}
          style={[styles.codigoBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
          <Text style={[styles.codigoBarText, { color: colors.text }]}>
            {laguna.codigo_dispositivo
              ? `Sensor: ${laguna.codigo_dispositivo}`
              : 'Sin sensor vinculado — toca para configurar'}
          </Text>
          <Ionicons name={showCodigo ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {showCodigo && laguna && (
        <View style={[styles.codigoPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {laguna.codigo_dispositivo && (
            <View style={styles.codigoActualRow}>
              <Text style={[styles.codigoActualLabel, { color: colors.textSecondary }]}>Código actual:</Text>
              <TouchableOpacity onPress={() => { Clipboard.setString(laguna.codigo_dispositivo); Alert.alert('Copiado'); }}>
                <Text style={[styles.codigoActualVal, { color: colors.primary }]}>
                  {laguna.codigo_dispositivo}  📋
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.codigoHint, { color: colors.textSecondary }]}>
            Ingresa el código que aparece en tu sensor ESP32:
          </Text>
          <View style={styles.codigoInputRow}>
            <TextInput
              value={codigoInput}
              onChangeText={v => setCodigoInput(v.toUpperCase())}
              placeholder="Ej: NP-A3F2"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={[styles.codigoInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TouchableOpacity
              onPress={handleVincular}
              disabled={vinculando || !codigoInput.trim()}
              style={[styles.codigoBtn, { backgroundColor: codigoInput.trim() ? colors.primary : colors.border }]}>
              {vinculando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.codigoBtnText}>Vincular</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderTabs()}

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {!laguna ? (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin lagunas creadas</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Crea una laguna en Inventario para comenzar</Text>
          </View>
        ) : !laguna.conectado && !laguna.codigo_dispositivo ? (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin sensor vinculado</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Toca "Sin sensor vinculado" arriba e ingresa el código de tu dispositivo IoT
            </Text>
          </View>
        ) : !laguna.conectado ? (
          <View style={styles.emptyState}>
            <Ionicons name="wifi-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sensor desconectado</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Código: {laguna.codigo_dispositivo} · Verifica que el ESP32 esté encendido
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={refresh}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 'sensores' && renderSensores()}
            {activeTab === 'graficos' && renderGraficos()}
            {activeTab === 'ia'       && renderIA()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  lagunaChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipDot:         { width: 7, height: 7, borderRadius: 4 },
  chipText:        { fontSize: 13, fontWeight: '600' },
  codigoBar:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  codigoBarText:   { flex: 1, fontSize: 13, fontWeight: '500' },
  codigoPanel:     { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  codigoActualRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codigoActualLabel:{ fontSize: 13 },
  codigoActualVal: { fontSize: 14, fontWeight: '700' },
  codigoHint:      { fontSize: 12 },
  codigoInputRow:  { flexDirection: 'row', gap: 8 },
  codigoInput:     { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  codigoBtn:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  codigoBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerTitle:     { fontSize: 24, fontWeight: 'bold' },
  headerStatus:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  statusText:      { fontSize: 12 },
  refreshBtn:      { padding: 8, borderRadius: 10 },
  tabBar:          { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabLabel:        { fontSize: 11, fontWeight: '500' },
  scroll:          { flex: 1 },
  sectionContent:  { padding: SPACING.lg, gap: SPACING.md },
  alertBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
  alertText:       { color: '#ef4444', fontWeight: '500', fontSize: 13 },
  sensorCard:      { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  sensorRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sensorIconWrapper: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  sensorIconRing:  { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5 },
  sensorIcon:      { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sensorInfo:      { flex: 1 },
  sensorLabel:     { fontSize: 12, marginBottom: 2 },
  sensorValueRow:  { flexDirection: 'row', alignItems: 'center' },
  sensorValue:     { fontSize: 22, fontWeight: '700' },
  sensorRange:     { fontSize: 11, textAlign: 'right' },
  progressBg:      { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(0,212,255,0.12)' },
  progressFill:    { height: '100%', borderRadius: 3 },
  bombaCard:       { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  bombaRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bombaInfo:       { flex: 1 },
  bombaTitle:      { fontSize: 15, fontWeight: '500' },
  bombaStatus:     { fontSize: 12, marginTop: 2 },
  gaugesCard:      { borderRadius: BORDER_RADIUS.xl, borderWidth: 1, padding: SPACING.lg, paddingVertical: SPACING.xl },
  gaugesRow:       { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  gaugeItem:       { alignItems: 'center', flex: 1 },
  gaugeLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  gaugeSensorLabel:{ fontSize: 11, fontWeight: '600' },
  gaugeOptRange:   { fontSize: 9, color: '#4D6A8A', marginTop: 3 },
  rangePicker:     { flexDirection: 'row', borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: 4, gap: 4 },
  rangeTab:        { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  rangeTabText:    { fontSize: 13, fontWeight: '500' },
  chartCard:       { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  chartHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  chartDot:        { width: 10, height: 10, borderRadius: 5 },
  chartTitle:      { flex: 1, fontSize: 14, fontWeight: '600' },
  chartCurrent:    { fontSize: 14, fontWeight: '700' },
  chartFooter:     { fontSize: 10, marginTop: 4, textAlign: 'center' },
  iaHeader:        { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  iaTitle:         { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  iaSub:           { fontSize: 11 },
  gaugesRow:       { flexDirection: 'row', gap: SPACING.md },
  gaugeBox:        { flex: 1, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, alignItems: 'center' },
  gaugeLabel:      { fontSize: 11, marginBottom: 8 },
  gaugeBarContainer:{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  gaugeBarBg:      { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  gaugeBarFill:    { height: '100%', borderRadius: 4 },
  gaugeScore:      { fontSize: 16, fontWeight: '700', width: 28, textAlign: 'right' },
  gaugeLevelText:  { fontSize: 11, fontWeight: '500', marginTop: 4 },
  projCard:        { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  projTitle:       { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  projRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, flexWrap: 'wrap' },
  projDot:         { width: 8, height: 8, borderRadius: 4 },
  projLabel:       { fontSize: 12, fontWeight: '500', width: 80 },
  projVal:         { fontSize: 11, flex: 1 },
  recCard:         { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md },
  recRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  recText:         { flex: 1, fontSize: 13 },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: 12, fontSize: 14 },
  emptyState:      { flex: 1, alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:      { fontSize: 18, fontWeight: '600' },
  emptyText:       { fontSize: 14 },
  retryBtn:        { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg },
  retryText:       { color: '#fff', fontWeight: '600' },
});

export default MonitoringScreen;