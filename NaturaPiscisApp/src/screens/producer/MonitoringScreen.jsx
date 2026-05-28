// ============================================================
// src/screens/producer/MonitoringScreen.jsx
// Monitoreo IoT con gráficos históricos, IA predictiva y estética Cyberpunk/Neón
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Switch, Dimensions, ActivityIndicator,
  Animated, Easing, TextInput, Alert, Clipboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line, Text as SvgText, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLagunas } from '../../hooks/useLagunas';
import { useSensorHistory } from '../../api/services/sensorHistory.service';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../../components/common/Loading';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { SENSOR_COLORS } from '../../constants/colors';
import GlassContainer from '../../components/ui/GlassContainer';
import NeonText from '../../components/ui/NeonText';

const { width } = Dimensions.get('window');
const CHART_WIDTH  = width - 48;
const CHART_HEIGHT = 160;
const CHART_PAD    = { top: 12, right: 16, bottom: 28, left: 36 };

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
// ── Mini gráfico SVG ──
const MiniChart = ({ data, cfg, isDark, neonCyan }) => {
  if (!data || data.length < 2) return null;
  const w = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const h = CHART_HEIGHT - CHART_PAD.top  - CHART_PAD.bottom;

  const minV = Math.min(...data) * 0.97;
  const maxV = Math.max(...data) * 1.03;
  const scX  = (i) => CHART_PAD.left + (i / (data.length - 1)) * w;
  const scY  = (v) => CHART_PAD.top + h - ((v - minV) / (maxV - minV || 1)) * h;

  const pts  = data.map((v, i) => `${scX(i)},${scY(v)}`).join(' ');
  const area = `M${scX(0)},${scY(data[0])} ` +
    data.map((v, i) => `L${scX(i)},${scY(v)}`).join(' ') +
    ` L${scX(data.length-1)},${CHART_PAD.top + h} L${scX(0)},${CHART_PAD.top + h} Z`;

  const optMinY = scY(Math.min(cfg.optMax, maxV));
  const optMaxY = scY(Math.max(cfg.optMin, minV));
  const optH    = Math.max(0, optMaxY - optMinY);

  const textColor = isDark ? 'rgba(255,255,255,0.45)' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6';

  const yLabels = [minV, (minV + maxV) / 2, maxV].map(v => ({
    val: v.toFixed(1),
    y:   scY(v),
  }));

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id={cfg.gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={cfg.color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={cfg.color} stopOpacity="0.01" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {yLabels.map((l, i) => (
        <Line key={i} x1={CHART_PAD.left} y1={l.y} x2={CHART_PAD.left + w} y2={l.y}
          stroke={gridColor} strokeWidth="1" />
      ))}

      {/* Zona óptima */}
      <Rect x={CHART_PAD.left} y={optMinY} width={w} height={optH}
        fill="#00FF88" opacity="0.05" />

      {/* Área rellena */}
      <Path d={area} fill={`url(#${cfg.gradId})`} />

      {/* Línea */}
      <Path d={`M${pts.split(' ').map((p,i) => (i===0?'M':'L')+p).join(' ')}`}
        stroke={cfg.color} strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Punto actual */}
      <Circle
        cx={scX(data.length - 1)} cy={scY(data[data.length - 1])}
        r="4.5" fill={cfg.color} stroke="#030712" strokeWidth="1.5" />

      {/* Eje Y labels */}
      {yLabels.map((l, i) => (
        <SvgText key={i} x={CHART_PAD.left - 6} y={l.y + 3.5}
          fontSize="9" fontFamily="SpaceGrotesk-Regular" fill={textColor} textAnchor="end">{l.val}</SvgText>
      ))}
    </Svg>
  );
};

// ── Gauge de riesgo ──
const RiskGauge = ({ score, label, colors, isDarkMode, neonCyan }) => {
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#ff8f00' : score >= 25 ? '#eab308' : '#00FF88';
  const levelLabel = score >= 75 ? 'CRÍTICO' : score >= 50 ? 'ALTO' : score >= 25 ? 'MODERADO' : 'ESTABLE';
  
  return (
    <GlassContainer intensity="medium" style={styles.gaugeBox} borderGlow={score >= 50} neonColor={color}>
      <Text style={[styles.gaugeLabel, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>{label}</Text>
      <View style={styles.gaugeBarContainer}>
        <View style={[styles.gaugeBarBg, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }]}>
          <View style={[styles.gaugeBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.gaugeScore, { color, fontFamily: 'SpaceGrotesk-Bold' }]}>{score}%</Text>
      </View>
      <Text style={[styles.gaugeLevelText, { color, fontFamily: 'SpaceGrotesk-Bold' }]}>{levelLabel}</Text>
    </GlassContainer>
  );
};

// ── Algoritmo de predicción ──
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
  if (t > 33) recs.push({ icon: 'thermometer-outline', text: 'Activar aireación — temperatura crítica en ascenso', color: '#ef4444' });
  if (t < 26) recs.push({ icon: 'snow-outline',        text: 'Temperatura baja detectada — reduce alimentación', color: '#00F5FF' });
  if (p < 6.5) recs.push({ icon: 'flask-outline',      text: 'pH ácido detectado — aplicar cal agrícola foliar', color: '#FFAA00' });
  if (p > 8.5) recs.push({ icon: 'flask-outline',      text: 'pH alcalino crítico — recambio parcial de agua',  color: '#FF00E5' });
  if (tr > 60) recs.push({ icon: 'eye-outline',        text: 'Turbidez excesiva — limpiar y revisar filtros',   color: '#BF5AF2' });
  if (recs.length === 0) recs.push({ icon: 'checkmark-circle-outline', text: 'Todos los biosensores estables en rango óptimo', color: '#00FF88' });
  return recs;
};

// ── Punto de estado animado ──
const AnimatedStatusDot = ({ isConnected, neonGreen, colors }) => {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1.6, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1,   duration: 1000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale,   { toValue: 1,   duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
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
      { backgroundColor: isConnected ? neonGreen : '#FF5370' },
      { transform: [{ scale }], opacity },
    ]} />
  );
};

// ── Gauge circular animado de alta fidelidad con órbita ──
const GAUGE_SIZE   = Math.floor((width - SPACING.lg * 2 - SPACING.md) / 3);
const GAUGE_STROKE = Math.max(6, Math.floor(GAUGE_SIZE * 0.075));
const GAUGE_CX     = GAUGE_SIZE / 2;
const GAUGE_CY     = GAUGE_SIZE / 2;
const GAUGE_R      = (GAUGE_SIZE - GAUGE_STROKE * 2.4 - 2) / 2;
const GAUGE_CIRC   = 2 * Math.PI * GAUGE_R;
const GAUGE_ARC    = GAUGE_CIRC * 0.75;
const GAUGE_GAP    = GAUGE_CIRC - GAUGE_ARC;

const SensorGauge = ({ value, unit, label, color, min, max, optMin, optMax, sensorIcon, isAlert, spinAngle }) => {
  const gaugeColor = isAlert ? '#FF5370' : color;
  const pct        = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const [arcFill, setArcFill] = useState(0);
  const animRef    = useRef(null);
  const targetArc  = (pct / 100) * GAUGE_ARC;

  useEffect(() => {
    const start    = Date.now();
    const duration = 1000;
    const animate  = () => {
      const t     = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // Quartic ease out
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
      <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE, justifyContent: 'center', alignItems: 'center' }}>
        {/* Órbita exterior giratoria */}
        <Animated.View
          style={{
            position: 'absolute',
            width: GAUGE_SIZE - 2,
            height: GAUGE_SIZE - 2,
            borderRadius: (GAUGE_SIZE - 2) / 2,
            borderWidth: 1.2,
            borderColor: `${color}28`,
            borderStyle: 'dashed',
            transform: [{ rotate: spinAngle }],
          }}
        />

        <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={{ position: 'absolute' }}>
          {/* Pista (track) de cristal */}
          <Circle
            cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={GAUGE_STROKE}
            strokeDasharray={`${GAUGE_ARC} ${GAUGE_GAP}`}
            strokeLinecap="round"
            transform={`rotate(135, ${GAUGE_CX}, ${GAUGE_CY})`}
          />
          
          {/* Rango óptimo sutilmente delineado */}
          <Circle
            cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
            fill="none"
            stroke={`${color}15`}
            strokeWidth={GAUGE_STROKE + 3}
            strokeDasharray={`${((optMax - optMin) / (max - min)) * GAUGE_ARC} ${GAUGE_CIRC}`}
            transform={`rotate(${135 + ((optMin - min) / (max - min)) * 270}, ${GAUGE_CX}, ${GAUGE_CY})`}
          />

          {/* Progreso neón brillante */}
          <Circle
            cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={GAUGE_STROKE}
            strokeDasharray={`${arcFill} ${GAUGE_CIRC - arcFill}`}
            strokeLinecap="round"
            transform={`rotate(135, ${GAUGE_CX}, ${GAUGE_CY})`}
          />
          
          {/* Valor principal */}
          <SvgText
            x={GAUGE_CX}
            y={GAUGE_CY + Math.floor(valFontSize * 0.35)}
            fontSize={valFontSize}
            fontFamily="SpaceGrotesk-Bold"
            fill={isAlert ? '#FF5370' : '#E8F0FF'}
            textAnchor="middle"
          >
            {value?.toFixed(1) ?? '--'}
          </SvgText>
          {/* Unidad */}
          <SvgText
            x={GAUGE_CX}
            y={GAUGE_CY + Math.floor(valFontSize * 0.35) + unitFontSize + 2}
            fontSize={unitFontSize}
            fontFamily="SpaceGrotesk-Medium"
            fill="rgba(255,255,255,0.4)"
            textAnchor="middle"
          >
            {displayUnit}
          </SvgText>
        </Svg>
      </View>
      
      <View style={styles.gaugeLabelRow}>
        <Ionicons name={sensorIcon} size={12} color={gaugeColor} style={{ textShadowColor: gaugeColor, textShadowRadius: 6 }} />
        <Text style={[styles.gaugeSensorLabel, { color: gaugeColor, fontFamily: 'SpaceGrotesk-Bold' }]} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.gaugeOptRange, { fontFamily: 'SpaceGrotesk-Regular' }]} numberOfLines={1}>
        ÓPTIMO: {optMin}–{optMax}
      </Text>
    </View>
  );
};

// ── Pantalla Principal ──
const MonitoringScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { lagunasArray, isConnected, isLoading, alerts, lastUpdate, controlBomba, vincularCodigo, refresh } = useLagunas();

  const [refreshing, setRefreshing]       = useState(false);
  const [timeRange, setTimeRange]         = useState('24h');
  const [activeTab, setActiveTab]         = useState('sensores');
  const [selectedId, setSelectedId]       = useState(null);
  const [codigoInput, setCodigoInput]     = useState('');
  const [vinculando, setVinculando]       = useState(false);
  const [showCodigo, setShowCodigo]       = useState(false);

  // Animación rotativa global para los anillos exteriores
  const spinValue = useRef(new Animated.Value(0)).current;

  // Colores neón
  const neonCyan = colors.neonCyan || '#00F5FF';
  const neonGreen = colors.neonGreen || '#00FF88';
  const neonMagenta = colors.neonMagenta || '#FF00E5';
  const neonAmber = colors.neonAmber || '#FFAA00';

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spinAngle = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const laguna = lagunasArray.find(l => l.id === selectedId) || lagunasArray[0] || null;

  useEffect(() => {
    if (lagunasArray.length && !selectedId) {
      setSelectedId(lagunasArray[0].id);
    }
  }, [lagunasArray]);

  const currentVals = {};
  if (laguna?.sensors) {
    laguna.sensors.forEach(s => { currentVals[s.type] = parseFloat(s.value); });
  }

  // Histórico real desde PostgreSQL (sensorBridge guarda cada 30s por laguna).
  const {
    historyMap,
    loading: loadingHistory,
    count:   historyCount,
    refresh: refreshHistory,
  } = useSensorHistory(laguna?.id, timeRange);

  const risk = calcRisk(currentVals, historyMap);
  const recommendations = getRecommendations(currentVals);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
    refreshHistory();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBomba = async () => {
    if (!laguna) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await controlBomba(laguna.id, !laguna.bomba);
  };

  const handleVincular = async () => {
    if (!laguna) return;
    const codigo = codigoInput.trim().toUpperCase();
    if (!codigo) {
      Alert.alert('Código requerido', 'Pega el código que te dio el administrador.');
      return;
    }
    setVinculando(true);
    try {
      await vincularCodigo(laguna.id, codigo);
      setCodigoInput('');
      setShowCodigo(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Sensor vinculado',
        `"${codigo}" quedó conectado a ${laguna.nombre}. Los datos empezarán a llegar en unos segundos.`
      );
    } catch (e) {
      const status = e.response?.status;
      const msg    = e.response?.data?.message;
      let titulo   = 'No se pudo vincular';
      let cuerpo   = msg || 'Verifica el código e intenta de nuevo.';

      if (status === 404) {
        titulo = 'Código no encontrado';
        cuerpo = 'Ese código no existe. Pídele al administrador uno válido.';
      } else if (status === 409) {
        titulo = 'Código ya usado';
        cuerpo = msg || 'Este código ya está vinculado a otra laguna.';
      } else if (status === 400) {
        titulo = 'Código inválido';
        cuerpo = msg || 'El formato del código no es correcto.';
      } else if (status === 403) {
        titulo = 'Dispositivo desactivado';
        cuerpo = msg || 'Este dispositivo está desactivado. Contacta al administrador.';
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(titulo, cuerpo);
    } finally {
      setVinculando(false);
    }
  };

  // ── Render Tabs ──
  const renderTabs = () => (
    <GlassContainer intensity="medium" style={styles.tabBar} borderGlow={false}>
      {[
        { key: 'sensores', icon: 'pulse-outline',      label: 'EN VIVO'   },
        { key: 'graficos', icon: 'bar-chart-outline',  label: 'HISTORIAL'  },
        { key: 'ia',       icon: 'brain-outline',      label: 'IA RIESGO' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && { borderBottomColor: neonCyan, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab(tab.key)}
          activeOpacity={0.7}
        >
          <Ionicons name={tab.icon} size={17} color={activeTab === tab.key ? neonCyan : (colors.textSecondary || '#94a3b8')} />
          <Text style={[styles.tabLabel, { color: activeTab === tab.key ? neonCyan : (colors.textSecondary || '#94a3b8'), fontFamily: 'SpaceGrotesk-Bold' }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </GlassContainer>
  );

  // ── Tab: Sensores en vivo ──
  const renderSensores = () => (
    <View style={styles.sectionContent}>
      {/* Alertas */}
      {alerts.length > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: `${colors.error || '#ef4444'}15`, borderColor: `${colors.error || '#ef4444'}40` }]}>
          <Ionicons name="warning-outline" size={18} color={colors.error || '#ef4444'} />
          <Text style={[styles.alertText, { color: colors.error || '#ef4444', fontFamily: 'SpaceGrotesk-Medium' }]}>
            {alerts.length} ALERTA{alerts.length > 1 ? 'S' : ''} DETECTADA{alerts.length > 1 ? 'S' : ''}
          </Text>
        </View>
      )}

      {/* Gauges circulares en un panel de cristal */}
      {laguna?.sensors && (
        <GlassContainer intensity="medium" style={styles.gaugesCard} borderGlow={alerts.length > 0} neonColor="#FF5370">
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
                  spinAngle={spinAngle}
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
        </GlassContainer>
      )}

      {/* Control Bomba Glassmorphism */}
      {laguna && (
        <GlassContainer intensity="medium" style={styles.bombaCard} borderGlow={laguna.bomba} neonColor={colors.secondary || '#10b981'}>
          <View style={styles.bombaRow}>
            <View style={[
              styles.bombaIconBg,
              { backgroundColor: laguna.bomba ? `${colors.secondary || '#10b981'}25` : 'rgba(255,255,255,0.04)' }
            ]}>
              <Ionicons name="water-outline" size={22} color={laguna.bomba ? (colors.secondary || '#10b981') : '#64748b'} />
            </View>
            <View style={styles.bombaInfo}>
              <Text style={[styles.bombaTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-SemiBold' }]}>
                Turbina / Bomba Recambio
              </Text>
              <Text style={[styles.bombaStatus, { color: laguna.bomba ? (colors.secondary || '#10b981') : '#64748b', fontFamily: 'SpaceGrotesk-Regular' }]}>
                {laguna.bomba ? 'SISTEMA DE AIREACIÓN ACTIVO' : 'SISTEMA DETENIDO'}
              </Text>
            </View>
            <Switch
              value={laguna.bomba || false}
              onValueChange={handleBomba}
              trackColor={{ false: 'rgba(255,255,255,0.06)', true: `${colors.secondary || '#10b981'}50` }}
              thumbColor={laguna.bomba ? (colors.secondary || '#10b981') : '#64748b'}
            />
          </View>
        </GlassContainer>
      )}
    </View>
  );

  // ── Tab: Gráficos Históricos ──
  const renderGraficos = () => (
    <View style={styles.sectionContent}>
      {/* Header de fuente */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 10.5, color: '#64748b', fontFamily: 'SpaceGrotesk-Medium', letterSpacing: 0.6 }}>
          HISTORIAL · POSTGRESQL
        </Text>
        <Text style={{ fontSize: 10.5, color: '#64748b', fontFamily: 'SpaceGrotesk-Medium' }}>
          {loadingHistory ? 'cargando...' : `${historyCount} registros`}
        </Text>
      </View>

      {/* Selector de rango de cristal */}
      <GlassContainer intensity="light" style={styles.rangePicker}>
        {TIME_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.rangeTab, timeRange === t.key && { backgroundColor: `${neonCyan}20` }]}
            onPress={() => setTimeRange(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rangeTabText, { color: timeRange === t.key ? neonCyan : '#94a3b8', fontFamily: 'SpaceGrotesk-Medium' }]}>
              {t.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </GlassContainer>

      {Object.entries(SENSOR_CFG).map(([key, cfg]) => (
        <GlassContainer key={key} intensity="medium" style={styles.chartCard} borderGlow={false}>
          <View style={styles.chartHeader}>
            <View style={[styles.chartDot, { backgroundColor: cfg.color, shadowColor: cfg.color, shadowRadius: 6, shadowOpacity: 0.8 }]} />
            <Text style={[styles.chartTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-SemiBold' }]}>
              {cfg.label.toUpperCase()}
            </Text>
            <Text style={[styles.chartCurrent, { color: cfg.color, fontFamily: 'SpaceGrotesk-Bold' }]}>
              {currentVals[key]?.toFixed(1) || '--'}{cfg.unit}
            </Text>
          </View>
          
          <MiniChart data={historyMap[key] || []} cfg={cfg} isDark={isDarkMode} neonCyan={neonCyan} />

          {(historyMap[key]?.length || 0) === 0 && !loadingHistory && (
            <Text style={[styles.chartFooter, { color: '#94a3b8', fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center', marginVertical: 8 }]}>
              {laguna?.codigo_dispositivo
                ? 'Sin lecturas en este rango — esperando datos del sensor...'
                : 'Vincula un sensor a esta laguna para ver el historial'}
            </Text>
          )}

          <Text style={[styles.chartFooter, { color: colors.textSecondary || '#64748b', fontFamily: 'SpaceGrotesk-Regular' }]}>
            Parámetros de Seguridad: {cfg.min}–{cfg.max}{cfg.unit} (Óptimo: {cfg.optMin}–{cfg.optMax}{cfg.unit})
          </Text>
        </GlassContainer>
      ))}
    </View>
  );

  // ── Tab: IA Predictiva ──
  const renderIA = () => (
    <View style={styles.sectionContent}>
      {/* Header Glass */}
      <GlassContainer intensity="heavy" style={styles.iaHeader} borderGlow={true} neonColor="#7c3aed">
        <Ionicons name="brain-outline" size={24} color="#7c3aed" style={{ textShadowColor: '#7c3aed', textShadowRadius: 8 }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.iaTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>
            IA Predictiva de Supervivencia
          </Text>
          <Text style={[styles.iaSub, { color: colors.textSecondary || '#94a3b8', fontFamily: 'SpaceGrotesk-Medium' }]}>
            Regresión cuántica lineal basada en Telemetría IoT en vivo
          </Text>
        </View>
      </GlassContainer>

      {/* Gauges */}
      <View style={styles.gaugesRow}>
        <RiskGauge score={risk.score2h} label="PROYECCIÓN +2H" colors={colors} isDarkMode={isDarkMode} neonCyan={neonCyan} />
        <RiskGauge score={risk.score4h} label="PROYECCIÓN +4H" colors={colors} isDarkMode={isDarkMode} neonCyan={neonCyan} />
      </View>

      {/* Proyecciones */}
      <GlassContainer intensity="medium" style={styles.projCard}>
        <Text style={[styles.projTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>
          Telemetría Proyectada
        </Text>
        {Object.entries(SENSOR_CFG).map(([key, cfg]) => {
          const bd = risk.breakdown[key] || {};
          return (
            <View key={key} style={[styles.projRow, { borderBottomColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, paddingBottom: 8 }]}>
              <View style={[styles.projDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.projLabel, { color: colors.text, fontFamily: 'SpaceGrotesk-Medium' }]}>{cfg.label}</Text>
              <Text style={[styles.projVal, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>
                En vivo: <Text style={{ color: cfg.color, fontFamily: 'SpaceGrotesk-Bold' }}>{currentVals[key]?.toFixed(1) || '--'}{cfg.unit}</Text>
              </Text>
              <Text style={[styles.projVal, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>
                +2h: <Text style={{ color: cfg.color, fontFamily: 'SpaceGrotesk-Bold' }}>{bd.p2h?.toFixed(1) || '--'}{cfg.unit}</Text>
              </Text>
              <Text style={[styles.projVal, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>
                +4h: <Text style={{ color: cfg.color, fontFamily: 'SpaceGrotesk-Bold' }}>{bd.p4h?.toFixed(1) || '--'}{cfg.unit}</Text>
              </Text>
            </View>
          );
        })}
      </GlassContainer>

      {/* Recomendaciones */}
      <GlassContainer intensity="medium" style={styles.recCard}>
        <Text style={[styles.projTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>
          Protocolos de Intervención IA
        </Text>
        {recommendations.map((r, i) => (
          <View key={i} style={[styles.recRow, { borderBottomColor: 'rgba(255,255,255,0.03)', borderBottomWidth: i < recommendations.length - 1 ? 1 : 0 }]}>
            <Ionicons name={r.icon} size={18} color={r.color} />
            <Text style={[styles.recText, { color: colors.text, fontFamily: 'SpaceGrotesk-Medium' }]}>{r.text}</Text>
          </View>
        ))}
      </GlassContainer>
    </View>
  );

  // ── Loading ──
  if (isLoading && !laguna) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>
            Enlazando telemetría IoT...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#030712' : colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <NeonText intensity="medium" color={neonCyan} variant="heading" style={{ fontSize: 24 }}>
            Monitoreo IoT
          </NeonText>
          <View style={styles.headerStatus}>
            <AnimatedStatusDot isConnected={isConnected} neonGreen={neonGreen} colors={colors} />
            <Text style={[styles.statusText, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>
              {isConnected ? `SISTEMA EN LÍNEA · ${lastUpdate ? new Date(lastUpdate).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : ''}` : 'MODO OFFLINE'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={[styles.refreshBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.surface }]} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={22} color={neonCyan} />
        </TouchableOpacity>
      </View>

      {/* Selector de lagunas */}
      {lagunasArray.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16, marginBottom: 8 }}
          contentContainerStyle={{ gap: 8, paddingRight: 24 }}>
          {lagunasArray.map(l => (
            <TouchableOpacity key={l.id}
              onPress={() => setSelectedId(l.id)}
              activeOpacity={0.7}
              style={[styles.lagunaChip,
                { backgroundColor: selectedId === l.id ? neonCyan : (isDarkMode ? 'rgba(255,255,255,0.04)' : colors.surface),
                  borderColor: selectedId === l.id ? neonCyan : 'rgba(255,255,255,0.08)' }]}>
              <View style={[styles.chipDot, { backgroundColor: l.conectado ? neonGreen : '#6b7280' }]} />
              <Text style={[styles.chipText, { color: selectedId === l.id ? '#030712' : colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>
                {l.nombre.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Barra de código */}
      {laguna && (
        <TouchableOpacity
          onPress={() => setShowCodigo(!showCodigo)}
          activeOpacity={0.8}
          style={[styles.codigoBar, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : colors.surface, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.border }]}>
          <Ionicons name="hardware-chip-outline" size={16} color={neonCyan} />
          <Text style={[styles.codigoBarText, { color: colors.text, fontFamily: 'SpaceGrotesk-Medium' }]}>
            {laguna.codigo_dispositivo
              ? `TELEMETRÍA ENLAZADA: ${laguna.codigo_dispositivo}`
              : 'SIN DISPOSITIVO IOT — TOCAR PARA ENLAZAR'}
          </Text>
          <Ionicons name={showCodigo ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {showCodigo && laguna && (
        <View style={[styles.codigoPanel, { backgroundColor: isDarkMode ? 'rgba(10,15,30,0.85)' : colors.surface, borderColor: 'rgba(255,255,255,0.08)' }]}>
          {laguna.codigo_dispositivo && (
            <View style={styles.codigoActualRow}>
              <Text style={[styles.codigoActualLabel, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Medium' }]}>Código actual:</Text>
              <TouchableOpacity onPress={() => { Clipboard.setString(laguna.codigo_dispositivo); Alert.alert('Copiado'); }}>
                <Text style={[styles.codigoActualVal, { color: neonCyan, fontFamily: 'SpaceGrotesk-Bold' }]}>
                  {laguna.codigo_dispositivo}  📋
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.codigoHint, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk-Regular' }]}>
            Ingresa la clave cuántica de tu sensor ESP32:
          </Text>
          <View style={styles.codigoInputRow}>
            <TextInput
              value={codigoInput}
              onChangeText={v => setCodigoInput(v.toUpperCase())}
              placeholder="Ej: NP-A3F2"
              placeholderTextColor={colors.textMuted || '#64748b'}
              autoCapitalize="characters"
              style={[styles.codigoInput, { color: colors.text, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', fontFamily: 'SpaceGrotesk-Bold' }]}
            />
            <TouchableOpacity
              onPress={handleVincular}
              disabled={vinculando || !codigoInput.trim()}
              style={[styles.codigoBtn, { backgroundColor: codigoInput.trim() ? neonCyan : 'rgba(255,255,255,0.06)' }]}>
              {vinculando
                ? <ActivityIndicator size="small" color="#030712" />
                : <Text style={[styles.codigoBtnText, { color: codigoInput.trim() ? '#030712' : '#94a3b8', fontFamily: 'SpaceGrotesk-Bold' }]}>ENLAZAR</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderTabs()}

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={neonCyan} />}
        showsVerticalScrollIndicator={false}
      >
        {!laguna ? (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={48} color={colors.textSecondary || '#64748b'} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>SIN LAGUNAS REGISTRADAS</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary || '#64748b', fontFamily: 'SpaceGrotesk-Regular' }]}>
              Crea un estanque en el Inventario para iniciar el monitoreo.
            </Text>
          </View>
        ) : !laguna.conectado && !laguna.codigo_dispositivo ? (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={48} color={colors.textSecondary || '#64748b'} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>SIN SENSOR VINCULADO</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary || '#64748b', fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center', paddingHorizontal: 40 }]}>
              Toca la barra superior e ingresa el ID cuántico de tu ESP32.
            </Text>
          </View>
        ) : !laguna.conectado ? (
          <View style={styles.emptyState}>
            <Ionicons name="wifi-outline" size={48} color={colors.textSecondary || '#64748b'} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'SpaceGrotesk-Bold' }]}>DISPOSITIVO FUERA DE LÍNEA</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary || '#64748b', fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center', paddingHorizontal: 40 }]}>
              Clave: {laguna.codigo_dispositivo} · Asegura que el sensor IoT esté alimentado.
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: neonCyan }]} onPress={refresh} activeOpacity={0.7}>
              <Text style={[styles.retryText, { color: '#030712', fontFamily: 'SpaceGrotesk-Bold' }]}>RECONECTAR</Text>
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
  chipText:        { fontSize: 12.5 },
  codigoBar:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, padding: 11, borderRadius: 12, borderWidth: 1 },
  codigoBarText:   { flex: 1, fontSize: 11.5, letterSpacing: 0.3 },
  codigoPanel:     { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  codigoActualRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codigoActualLabel:{ fontSize: 13 },
  codigoActualVal: { fontSize: 14.5 },
  codigoHint:      { fontSize: 12 },
  codigoInputRow:  { flexDirection: 'row', gap: 8 },
  codigoInput:     { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, letterSpacing: 2 },
  codigoBtn:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  codigoBtnText:   { fontSize: 12.5 },
  headerStatus:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  statusText:      { fontSize: 11, letterSpacing: 0.4 },
  refreshBtn:      { padding: 8, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  tabBar:          { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, paddingVertical: 2 },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  tabLabel:        { fontSize: 10.5, letterSpacing: 0.4 },
  scroll:          { flex: 1 },
  sectionContent:  { padding: SPACING.lg, gap: SPACING.md },
  alertBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
  alertText:       { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.4 },
  bombaCard:       { padding: SPACING.md, borderRadius: 20 },
  bombaRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bombaIconBg:     { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  bombaInfo:       { flex: 1 },
  bombaTitle:      { fontSize: 15 },
  bombaStatus:     { fontSize: 11, letterSpacing: 0.3, marginTop: 2 },
  gaugesCard:      { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xl, borderRadius: 22 },
  gaugesRow:       { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  gaugeItem:       { alignItems: 'center', flex: 1 },
  gaugeLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  gaugeSensorLabel:{ fontSize: 10.5, letterSpacing: 0.4 },
  gaugeOptRange:   { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 },
  rangePicker:     { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14 },
  rangeTab:        { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  rangeTabText:    { fontSize: 11.5, letterSpacing: 0.4 },
  chartCard:       { padding: SPACING.md, borderRadius: 20 },
  chartHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  chartDot:        { width: 9, height: 9, borderRadius: 4.5 },
  chartTitle:      { flex: 1, fontSize: 13, letterSpacing: 0.3 },
  chartCurrent:    { fontSize: 15.5 },
  chartFooter:     { fontSize: 10, marginTop: 6, textAlign: 'center' },
  iaHeader:        { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, borderRadius: 20 },
  iaTitle:         { fontSize: 14.5 },
  iaSub:           { fontSize: 11, marginTop: 2 },
  gaugeBox:        { flex: 1, padding: SPACING.md, alignItems: 'center', borderRadius: 20 },
  gaugeLabel:      { fontSize: 10.5, letterSpacing: 0.4 },
  gaugeBarContainer:{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  gaugeBarBg:      { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  gaugeBarFill:    { height: '100%', borderRadius: 4 },
  gaugeScore:      { fontSize: 14.5 },
  gaugeLevelText:  { fontSize: 10.5, marginTop: 6 },
  projCard:        { padding: SPACING.md, borderRadius: 20 },
  projTitle:       { fontSize: 14.5, marginBottom: 12 },
  projRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, flexWrap: 'wrap' },
  projDot:         { width: 8, height: 8, borderRadius: 4 },
  projLabel:       { fontSize: 12, width: 80 },
  projVal:         { fontSize: 11, flex: 1 },
  recCard:         { padding: SPACING.md, borderRadius: 20 },
  recRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  recText:         { flex: 1, fontSize: 12.5, lineHeight: 18 },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: 12, fontSize: 13, letterSpacing: 0.3 },
  emptyState:      { flex: 1, alignItems: 'center', paddingTop: 90, gap: 8 },
  emptyTitle:      { fontSize: 16.5, letterSpacing: 0.4 },
  emptyText:       { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:        { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText:       { fontSize: 12.5 },
});

export default MonitoringScreen;