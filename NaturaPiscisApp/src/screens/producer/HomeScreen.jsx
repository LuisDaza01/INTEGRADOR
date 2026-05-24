// src/screens/producer/HomeScreen.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Switch,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLagunas } from '../../hooks/useLagunas';
import { LoadingSpinner } from '../../components/common/Loading';
import { SPACING } from '../../constants/theme';
import { FishIndicator } from '../../components/ui/FishRefreshControl';
import api from '../../api/axios.config';

// ─── Tarjeta de Resumen Mensual generado por Claude ──────────────
const ResumenMensualIA = ({ C, styles }) => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/estadisticas/resumen-mensual');
        const d = res.data?.data || res.data;
        if (alive) setData(d || { texto: null });
      } catch { if (alive) setData({ texto: null }); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const regenerar = async () => {
    setGenerando(true);
    try {
      const res = await api.post('/estadisticas/resumen-mensual/generar');
      setData(res.data?.data || res.data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo generar el resumen');
    } finally { setGenerando(false); }
  };

  if (loading) return null;

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: SPACING.md,
      marginTop: SPACING.md,
      borderWidth: 1,
      borderColor: C.primary + '40',
      shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>Resumen del mes</Text>
          <Text style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
            {data?.generado_at
              ? `Actualizado ${new Date(data.generado_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}`
              : 'Aún no generado'}
          </Text>
        </View>
        <TouchableOpacity onPress={regenerar} disabled={generando}
          style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: C.primary + '55', backgroundColor: C.primary + '15' }}>
          {generando
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary }}>{data?.texto ? '🔄' : '✨ Generar'}</Text>}
        </TouchableOpacity>
      </View>
      {data?.texto ? (
        <Text style={{ color: C.text, fontSize: 13, lineHeight: 19 }}>{data.texto}</Text>
      ) : (
        <Text style={{ color: C.sub, fontSize: 12, fontStyle: 'italic' }}>
          Toca "Generar" para un resumen narrativo del mes con tus ventas, comparación y producto top.
        </Text>
      )}
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const C = {
    bg:      colors.background,
    surface: colors.surface,
    card:    colors.card,
    border:  colors.border,
    text:    colors.text,
    sub:     colors.textSecondary,
    hint:    colors.textMuted,
    primary: colors.secondary,
    teal:    '#14b8a6',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
    textSub:  colors.textSecondary,
    textHint: colors.textMuted,
    red:     '#f87171',
  };
  const styles = makeStyles(C);

  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    lagunasArray, isConnected, isLoading, alerts,
    lastUpdate, controlBomba, getSummary, refresh
  } = useLagunas();

  const [refreshing, setRefreshing] = useState(false);
  const [produccion, setProduccion] = useState(null);
  const summary = getSummary();

  const fetchProduccion = useCallback(async () => {
    try {
      const res = await api.get('/lagunas');
      const lagunas = res.data?.data || [];
      const activas = lagunas.filter(l => l.produccion);
      const totalPeces = activas.reduce((s, l) => s + (l.produccion?.peces_actuales || 0), 0);
      const totalBiomasa = activas.reduce((s, l) => s + (l.produccion?.biomasaKg || 0), 0);
      const totalAlimento = activas.reduce((s, l) => s + (l.produccion?.alimentacion?.totalDiaKg || 0), 0);
      setProduccion({ activas: activas.length, totalPeces, totalBiomasa: Math.round(totalBiomasa * 10) / 10, totalAlimento: Math.round(totalAlimento * 10) / 10 });
    } catch (_) {}
  }, []);

  useEffect(() => { fetchProduccion(); }, [fetchProduccion]);

  // Wave animation
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const makeWave = (val, duration, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, useNativeDriver: true }),
        ])
      );
    Animated.parallel([
      makeWave(wave1, 2800, 0),
      makeWave(wave2, 3400, 400),
      makeWave(wave3, 2200, 800),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    refresh();
    fetchProduccion();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBombaToggle = async (lagunaId, currentState) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await controlBomba(lagunaId, !currentState);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Sin datos';
    const diff = Math.floor((new Date() - lastUpdate) / 1000);
    if (diff < 10) return 'Ahora';
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  };

  const handleAlertsPress = () => navigation.navigate('Devices');
  const handleEstadisticas = () => navigation.navigate('Estadisticas');

  const firstName = user?.nombre?.split(' ')[0] || 'Productor';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor="transparent" colors={['transparent']} progressBackgroundColor="transparent" />
          }
          showsVerticalScrollIndicator={false}
        >
          <FishIndicator visible={refreshing} />
          {/* ─── Hero Header ─── */}
          <LinearGradient
            colors={['#071228', '#0a1835', '#061020', '#04101c']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Top shimmer line */}
            <LinearGradient
              colors={['transparent', C.primary, C.teal, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.heroTopLine}
            />

            {/* Large ambient glow orbs */}
            <View style={styles.heroOrb1} />
            <View style={styles.heroOrb2} />
            <View style={styles.heroOrb3} />

            {/* Animated waves at bottom */}
            <Animated.View style={[styles.wave, styles.wave1, {
              transform: [{ translateY: wave1.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
              opacity: wave1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.55, 0.35] }),
            }]} />
            <Animated.View style={[styles.wave, styles.wave2, {
              transform: [{ translateY: wave2.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) }],
              opacity: wave2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.45, 0.25] }),
            }]} />
            <Animated.View style={[styles.wave, styles.wave3, {
              transform: [{ translateY: wave3.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
              opacity: wave3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.3, 0.15] }),
            }]} />

            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{firstName}</Text>
                <View style={styles.heroStatus}>
                  <View style={[styles.statusDot, {
                    backgroundColor: isConnected ? C.green : C.red,
                    shadowColor: isConnected ? C.green : C.red,
                    shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
                  }]} />
                  <Text style={[styles.statusText, { color: isConnected ? C.green : C.red }]}>
                    {isConnected ? 'Sensores activos' : 'Sin conexión'}
                  </Text>
                </View>
              </View>

              <View style={styles.heroRight}>
                {/* Update badge */}
                <View style={styles.updateBadge}>
                  <Ionicons name="time-outline" size={11} color={C.primary} />
                  <Text style={styles.updateText}>{formatLastUpdate()}</Text>
                </View>
                {/* Notification button */}
                <TouchableOpacity style={styles.notifBtn} onPress={handleAlertsPress}>
                  <Ionicons name="notifications-outline" size={22} color={C.primary} />
                  {(unreadCount > 0 || alerts.length > 0) && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {(unreadCount + alerts.length) > 9 ? '9+' : (unreadCount + alerts.length)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* ─── Stats Grid ─── */}
          <View style={styles.statsGrid}>
            <GlowStatCard icon="fish" label="Lagunas"  value={summary.totalLagunas}    glow={C.primary} />
            <GlowStatCard icon="alert-circle-outline" label="Alertas"  value={summary.criticalAlerts}
              glow={summary.criticalAlerts > 0 ? C.red : C.green} onPress={handleAlertsPress} />
            <GlowStatCard icon="pulse"        label="Sensores" value={summary.sensoresOk}       glow={C.green} />
            <GlowStatCard icon="water-outline" label="Bombas"   value={summary.bombasActivas}    glow={C.teal} />
          </View>

          {/* ─── Resumen mensual IA ─── */}
          <ResumenMensualIA C={C} styles={styles} />

          {/* ─── Loading ─── */}
          {isLoading && (
            <View style={styles.card}>
              <View style={styles.centeredPad}>
                <LoadingSpinner />
                <Text style={[styles.sub, { marginTop: 12 }]}>Conectando a sensores...</Text>
              </View>
            </View>
          )}

          {/* ─── Lagunas ─── */}
          {!isLoading && lagunasArray.map((laguna) => (
            <LagunaCard key={laguna.id} laguna={laguna}
              onBombaToggle={() => handleBombaToggle(laguna.id, laguna.bomba)}
              onPress={() => navigation.navigate('Devices')} />
          ))}

          {/* ─── Sin datos ─── */}
          {!isLoading && lagunasArray.length === 0 && (
            <View style={styles.card}>
              <View style={styles.centeredPad}>
                <Ionicons name="cloud-offline-outline" size={48} color={C.textHint} />
                <Text style={[styles.title, { marginTop: 12 }]}>Sin datos de sensores</Text>
                <Text style={styles.sub}>Verifica la conexión del ESP32</Text>
              </View>
            </View>
          )}

          {/* ─── Alertas ─── */}
          {alerts.length > 0 && (
            <View style={[styles.card, { borderColor: 'rgba(248,113,113,0.3)' }]}>
              <Text style={[styles.sectionTitle, { color: C.red }]}>⚠️ Alertas Activas</Text>
              {alerts.slice(0, 4).map((alert, index) => (
                <View key={index} style={styles.alertRow}>
                  <View style={[styles.alertDot, {
                    backgroundColor: alert.status === 'critical' ? C.red : C.orange,
                    shadowColor:     alert.status === 'critical' ? C.red : C.orange,
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sub, { fontSize: 11 }]}>
                      {alert.lagunaId === 'laguna1' ? 'Laguna 1' : 'Laguna 2'}
                    </Text>
                    <Text style={styles.bodyText}>{alert.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ─── Mi Producción ─── */}
          {produccion !== null && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Inventario')}>
              <View style={[styles.card, { borderColor: 'rgba(74,222,128,0.25)' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                  <Text style={styles.sectionTitle}>🐟 Mi Producción</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textHint} />
                </View>
                {produccion.activas === 0 ? (
                  <Text style={[styles.sub, { textAlign: 'center', paddingVertical: 8 }]}>
                    Sin siembras activas — toca para iniciar
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={styles.prodStatCell}>
                      <Text style={[styles.prodStatVal, { color: C.green }]}>{produccion.activas}</Text>
                      <Text style={styles.prodStatLbl}>Lagunas</Text>
                    </View>
                    <View style={styles.prodStatCell}>
                      <Text style={[styles.prodStatVal, { color: C.teal }]}>{produccion.totalPeces.toLocaleString()}</Text>
                      <Text style={styles.prodStatLbl}>Peces</Text>
                    </View>
                    <View style={styles.prodStatCell}>
                      <Text style={[styles.prodStatVal, { color: C.orange }]}>{produccion.totalBiomasa} kg</Text>
                      <Text style={styles.prodStatLbl}>Biomasa</Text>
                    </View>
                    <View style={styles.prodStatCell}>
                      <Text style={[styles.prodStatVal, { color: C.purple }]}>{produccion.totalAlimento} kg</Text>
                      <Text style={styles.prodStatLbl}>Alimento/día</Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* ─── Acciones Rápidas ─── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.actionsRow}>
              <ActionBtn icon="calendar-outline"        label="Calendario" onPress={() => navigation.navigate('Calendario')}         glow="#fbbf24" />
              <ActionBtn icon="checkmark-done-outline"  label="Reservas"   onPress={() => navigation.navigate('ReservasProductor')} glow="#a78bfa" />
              <ActionBtn icon="stats-chart-outline"     label="Historial"  onPress={handleEstadisticas}                              glow={C.purple} />
              <ActionBtn icon="settings-outline"        label="Config"     onPress={() => navigation.navigate('Profile')}            glow={C.orange} />
            </View>
          </View>

          {/* ─── Automatización ─── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Automatización Activa</Text>
            {[
              'Bomba automática si nivel bajo',
              'Bomba automática si temperatura > 36°C',
              'Notificaciones push activadas',
            ].map((text, i) => (
              <View key={i} style={styles.autoRow}>
                <Ionicons name="checkmark-circle" size={16} color={C.green} />
                <Text style={styles.autoText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* ─── Stats CTA ─── */}
          <TouchableOpacity onPress={handleEstadisticas} activeOpacity={0.85}>
            <LinearGradient
              colors={['#0d9488', '#0f766e']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.statsCta}
            >
              <View style={styles.statsCtaLeft}>
                <View style={styles.statsCtaIcon}>
                  <Ionicons name="stats-chart-outline" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={styles.statsCtaTitle}>Ver estadísticas</Text>
                  <Text style={styles.statsCtaSub}>Ingresos, pedidos y top productos</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ── Sub-components ──────────────────────────────────────────────

const GlowStatCard = ({ icon, label, value, glow, onPress }) => {
  const { colors: gColors } = useTheme();
  const styles = makeStyles({ bg: gColors.background, surface: gColors.surface, card: gColors.card, border: gColors.border, text: gColors.text, sub: gColors.textSecondary, hint: gColors.textMuted, primary: gColors.secondary, teal: '#14b8a6', green: '#4ade80', orange: '#fb923c', purple: '#c084fc', textSub: gColors.textSecondary, textHint: gColors.textMuted, red: '#f87171' });
  return (
    <TouchableOpacity style={[styles.statCard, { borderColor: `${glow}30` }]}
      onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      <LinearGradient
        colors={[`${glow}18`, `${glow}08`]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.statIcon, { backgroundColor: `${glow}20`, shadowColor: glow }]}>
        <Ionicons name={icon} size={18} color={glow} />
      </View>
      <Text style={[styles.statValue, { color: glow }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const LagunaCard = ({ laguna, onBombaToggle, onPress }) => {
  const { colors: lColors } = useTheme();
  const C = {
    bg:      lColors.background,
    surface: lColors.surface,
    card:    lColors.card,
    border:  lColors.border,
    text:    lColors.text,
    sub:     lColors.textSecondary,
    hint:    lColors.textMuted,
    primary: lColors.secondary,
    teal:    '#14b8a6',
    green:   '#4ade80',
    orange:  '#fb923c',
    purple:  '#c084fc',
    textSub:  lColors.textSecondary,
    textHint: lColors.textMuted,
    red:     '#f87171',
  };
  const styles = makeStyles(C);
  const hasCritical = laguna.alerts.some(a => a.status === 'critical');
  const hasAlerts   = laguna.alerts.length > 0;
  const borderColor = hasCritical ? 'rgba(248,113,113,0.35)' : hasAlerts ? 'rgba(251,146,60,0.35)' : C.border;

  return (
    <View style={[styles.card, { borderColor }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.lagunaHeader}>
          <View style={styles.lagTag}>
            <Ionicons name="fish" size={14} color={C.primary} />
            <Text style={styles.lagName}>{laguna.name}</Text>
          </View>
          <Text style={[styles.lagStatus, {
            color: hasCritical ? C.red : hasAlerts ? C.orange : C.green,
          }]}>
            {hasCritical ? '⚠ Atención' : hasAlerts ? '⚡ Alertas' : '✔ Normal'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Sensors */}
      <View style={styles.sensorsRow}>
        {laguna.sensors.map((sensor) => (
          <View key={sensor.id} style={styles.sensorCell}>
            <Ionicons name={sensor.icon} size={15} color={sensor.color} />
            <Text style={styles.sensorVal}>
              {sensor.value}
              <Text style={styles.sensorUnit}>{sensor.unit}</Text>
            </Text>
            <Text style={styles.sensorLbl}>{sensor.label}</Text>
            <View style={[styles.sensorDot, {
              backgroundColor: sensor.status === 'normal' ? C.green :
                               sensor.status === 'warning' ? C.orange : C.red,
              shadowColor: sensor.status === 'normal' ? C.green :
                           sensor.status === 'warning' ? C.orange : C.red,
            }]} />
          </View>
        ))}
      </View>

      {/* Pump control */}
      <View style={[styles.bombaRow, {
        backgroundColor: laguna.bomba ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
        borderColor:     laguna.bomba ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)',
      }]}>
        <View style={styles.bombaInfo}>
          <Ionicons name={laguna.bomba ? 'water' : 'water-outline'} size={18}
            color={laguna.bomba ? C.green : C.textHint} />
          <Text style={[styles.bodyText, { color: laguna.bomba ? C.green : C.textSub }]}>
            Bomba: {laguna.bomba ? 'ON' : 'OFF'}
          </Text>
        </View>
        <Switch value={laguna.bomba} onValueChange={onBombaToggle}
          trackColor={{ false: '#1e293b', true: '#0ea5e9' }}
          thumbColor={laguna.bomba ? '#fff' : '#475569'} />
      </View>
    </View>
  );
};

const ActionBtn = ({ icon, label, onPress, glow }) => {
  const { colors: aColors } = useTheme();
  const C = { textSub: aColors.textSecondary };
  const styles = makeStyles({ ...C, border: aColors.border, text: aColors.text, sub: aColors.textSecondary, hint: aColors.textMuted, primary: aColors.secondary, teal: '#14b8a6', green: '#4ade80', orange: '#fb923c', purple: '#c084fc', textHint: aColors.textMuted, red: '#f87171', bg: aColors.background, surface: aColors.surface, card: aColors.card });
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, { backgroundColor: `${glow}18`, borderColor: `${glow}30`, shadowColor: glow }]}>
        <Ionicons name={icon} size={22} color={glow} />
      </View>
      <Text style={[styles.actionLabel, { color: C.textSub }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ── Styles ──────────────────────────────────────────────────────
const makeStyles = (C) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  safeArea:      { flex: 1, backgroundColor: C.bg },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Hero
  hero: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  heroTopLine: { height: 1, position: 'absolute', top: 0, left: 0, right: 0 },
  heroOrb1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(56,189,248,0.1)', top: -80, right: -60,
  },
  heroOrb2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(20,184,166,0.08)', bottom: -50, left: -40,
  },
  heroOrb3: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(139,92,246,0.07)', top: '30%', left: '40%',
  },
  // Animated waves
  wave: {
    position: 'absolute', left: -20, right: -20, height: 60, borderRadius: 30,
    bottom: -20,
  },
  wave1: { backgroundColor: 'rgba(56,189,248,0.12)', bottom: -18 },
  wave2: { backgroundColor: 'rgba(20,184,166,0.09)', bottom: -10 },
  wave3: { backgroundColor: 'rgba(139,92,246,0.06)', bottom: -4 },
  heroRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft:    { flex: 1 },
  heroRight:   { alignItems: 'flex-end', gap: 8 },
  greeting:    { fontSize: 13, color: C.textSub, marginBottom: 2 },
  userName:    { fontSize: 26, fontWeight: 'bold', color: C.text, marginBottom: 6 },
  heroStatus:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 12, fontWeight: '500' },
  updateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(56,189,248,0.1)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)',
  },
  updateText:  { fontSize: 11, color: C.primary, fontWeight: '500' },
  notifBtn:   {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(56,189,248,0.1)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)',
  },

  // Stats grid
  statsGrid:  {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },
  statCard:   {
    flex: 1, minWidth: '45%', borderRadius: 16, padding: SPACING.md,
    alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  statIcon:   {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },
  statValue:  { fontSize: 22, fontWeight: 'bold', color: C.text },
  statLabel:  { fontSize: 11, color: C.textSub, marginTop: 2 },

  // Card
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 20,
    padding: SPACING.md,
    backgroundColor: '#111d30',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: SPACING.md },
  centeredPad:  { alignItems: 'center', paddingVertical: SPACING.xl },
  title:        { fontSize: 16, fontWeight: '600', color: C.text },
  sub:          { fontSize: 12, color: C.textSub, marginTop: 2 },
  bodyText:     { fontSize: 13, color: C.text },

  // Alerts
  alertRow:   { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'flex-start' },
  alertDot:   {
    width: 8, height: 8, borderRadius: 4, marginTop: 4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5, elevation: 3,
  },

  // Laguna card
  lagunaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  lagTag:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lagName:      { fontSize: 15, fontWeight: '700', color: C.text },
  lagStatus:    { fontSize: 11, fontWeight: '600' },
  sensorsRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  sensorCell:   { alignItems: 'center', flex: 1 },
  sensorVal:    { fontSize: 15, fontWeight: 'bold', color: C.text, marginTop: 3 },
  sensorUnit:   { fontSize: 9, fontWeight: 'normal', color: C.textSub },
  sensorLbl:    { fontSize: 9, color: C.textSub, marginTop: 1 },
  sensorDot:    {
    width: 6, height: 6, borderRadius: 3, marginTop: 3,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3,
  },
  bombaRow:   {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.sm, borderRadius: 10, borderWidth: 1,
  },
  bombaInfo:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },

  // Actions
  actionsRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn:   { alignItems: 'center', flex: 1 },
  actionIcon:  {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },
  actionLabel: { fontSize: 10, textAlign: 'center', color: C.textSub, marginTop: 2 },

  // Automation
  autoRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 5 },
  autoText: { fontSize: 13, color: C.textSub },

  // Production widget
  prodStatCell: { alignItems: 'center', flex: 1 },
  prodStatVal:  { fontSize: 16, fontWeight: 'bold' },
  prodStatLbl:  { fontSize: 9, color: C.textSub, marginTop: 2 },

  // Stats CTA
  statsCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 18, padding: SPACING.md,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },
  statsCtaLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statsCtaIcon:  {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  statsCtaTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statsCtaSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },

  // Notification badge
  badge:     {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
});

export default HomeScreen;
