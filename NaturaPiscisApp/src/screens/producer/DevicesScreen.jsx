// src/screens/producer/DevicesScreen.jsx
// Pantalla de control de dispositivos IoT para múltiples lagunas

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLagunas } from '../../hooks/useLagunas';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/Loading';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const DevicesScreen = () => {
  const { colors } = useTheme();
  
  const { 
    lagunasArray,
    isConnected, 
    isLoading,
    alerts,
    lastUpdate,
    controlBomba,
    refresh,
    SENSOR_THRESHOLDS,
  } = useLagunas();
  
  const [refreshing, setRefreshing] = useState(false);
  const [bombaLoading, setBombaLoading] = useState({});
  const [selectedLaguna, setSelectedLaguna] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBombaToggle = async (lagunaId, currentState) => {
    setBombaLoading(prev => ({ ...prev, [lagunaId]: true }));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await controlBomba(lagunaId, !currentState);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo controlar la bomba');
    } finally {
      setBombaLoading(prev => ({ ...prev, [lagunaId]: false }));
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Sin conexión';
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    if (diff < 10) return 'Ahora';
    if (diff < 60) return `Hace ${diff}s`;
    return `Hace ${Math.floor(diff / 60)}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Control IoT</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Monitoreo y automatización</Text>
        </View>
        <View style={[styles.connectionBadge, { backgroundColor: colors.surface }]}>
          <View style={[
            styles.connectionDot, 
            { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }
          ]} />
          <Text style={[
            styles.connectionText,
            { color: isConnected ? '#22c55e' : '#ef4444' }
          ]}>
            {isConnected ? 'Conectado' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estado de actualización */}
        <View style={styles.updateInfo}>
          <Ionicons name="sync-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.updateText, { color: colors.textSecondary }]}>
            Última actualización: {formatLastUpdate()}
          </Text>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Conectando a sensores...</Text>
          </View>
        )}

        {/* Sin lagunas */}
        {!isLoading && lagunasArray.length === 0 && (
          <Card style={styles.section}>
            <CardBody>
              <View style={styles.emptyContainer}>
                <Ionicons name="hardware-chip-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin dispositivos</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No se encontraron lagunas conectadas.
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Estructura esperada en Firebase:{'\n'}
                  laguna1/temperatura, ph, turbidez, nivel, bomba{'\n'}
                  laguna2/temperatura, ph, turbidez, nivel, bomba
                </Text>
              </View>
            </CardBody>
          </Card>
        )}

        {/* Tarjetas de Control por Laguna */}
        {lagunasArray.map((laguna) => (
          <Card 
            key={laguna.id} 
            style={[
              styles.lagunaCard,
              laguna.alerts.some(a => a.status === 'critical') && styles.cardCritical,
              laguna.alerts.length > 0 && !laguna.alerts.some(a => a.status === 'critical') && styles.cardWarning
            ]}
          >
            {/* Header de Laguna */}
            <TouchableOpacity 
              style={styles.lagunaHeader}
              onPress={() => setSelectedLaguna(
                selectedLaguna === laguna.id ? null : laguna.id
              )}
            >
              <View style={styles.lagunaInfo}>
                <View style={[
                  styles.lagunaIcon,
                  { backgroundColor: laguna.bomba ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)' }
                ]}>
                  <Ionicons 
                    name="fish" 
                    size={28} 
                    color={laguna.bomba ? '#3b82f6' : '#64748b'} 
                  />
                </View>
                <View>
                  <Text style={[styles.lagunaName, { color: colors.text }]}>{laguna.name}</Text>
                  <Text style={[
                    styles.lagunaStatus,
                    { color: laguna.alerts.some(a => a.status === 'critical') ? '#ef4444' : 
                      laguna.alerts.length > 0 ? '#f59e0b' : '#22c55e' }
                  ]}>
                    {laguna.alerts.some(a => a.status === 'critical') ? '⚠️ Atención requerida' :
                     laguna.alerts.length > 0 ? '⚡ Alertas activas' : '✓ Estado normal'}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={selectedLaguna === laguna.id ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>

            {/* Grid de Sensores */}
            <View style={styles.sensorsGrid}>
              {laguna.sensors.map((sensor) => (
                <View 
                  key={sensor.id} 
                  style={[styles.sensorCard, { borderLeftColor: sensor.color, backgroundColor: colors.elevated }]}
                >
                  <View style={styles.sensorHeader}>
                    <Ionicons name={sensor.icon} size={18} color={sensor.color} />
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(sensor.status) }]} />
                  </View>
                  <Text style={[styles.sensorValue, { color: colors.text }]}>
                    {sensor.value}
                    <Text style={[styles.sensorUnit, { color: colors.textSecondary }]}>{sensor.unit}</Text>
                  </Text>
                  <Text style={[styles.sensorLabel, { color: colors.textSecondary }]}>{sensor.label}</Text>
                  {sensor.minValue !== undefined && (
                    <Text style={[styles.sensorRange, { color: colors.textSecondary }]}>
                      {sensor.minValue} - {sensor.maxValue}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Control de Bomba */}
            <View style={styles.bombaSection}>
              <View style={[styles.bombaControl, { backgroundColor: colors.elevated }]}>
                <View style={styles.bombaInfo}>
                  <View style={[
                    styles.bombaIconContainer,
                    { backgroundColor: laguna.bomba ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.1)' }
                  ]}>
                    <Ionicons 
                      name={laguna.bomba ? 'water' : 'water-outline'} 
                      size={24} 
                      color={laguna.bomba ? '#3b82f6' : '#64748b'} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.bombaTitle, { color: colors.text }]}>Bomba de Agua</Text>
                    <Text style={[
                      styles.bombaStatus,
                      { color: laguna.bomba ? '#22c55e' : '#64748b' }
                    ]}>
                      {laguna.bomba ? '● Encendida' : '○ Apagada'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={laguna.bomba}
                  onValueChange={() => handleBombaToggle(laguna.id, laguna.bomba)}
                  disabled={bombaLoading[laguna.id] || !isConnected}
                  trackColor={{ false: colors.border, true: '#3b82f6' }}
                  thumbColor={laguna.bomba ? '#fff' : '#94a3b8'}
                />
              </View>

              {/* Botones de acción rápida */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={[
                    styles.quickButton,
                    laguna.bomba && styles.quickButtonActive
                  ]}
                  onPress={() => handleBombaToggle(laguna.id, laguna.bomba)}
                  disabled={bombaLoading[laguna.id] || !isConnected}
                >
                  <Ionicons 
                    name="power" 
                    size={18} 
                    color={laguna.bomba ? '#fff' : colors.primary} 
                  />
                  <Text style={[
                    styles.quickButtonText,
                    { color: laguna.bomba ? '#fff' : colors.primary }
                  ]}>
                    {laguna.bomba ? 'Apagar' : 'Encender'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => Alert.alert(
                    '⏱️ Temporizador',
                    'Programar encendido/apagado automático.\n\nPróximamente...'
                  )}
                >
                  <Ionicons name="timer-outline" size={18} color={colors.primary} />
                  <Text style={[styles.quickButtonText, { color: colors.primary }]}>Timer</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => Alert.alert(
                    '📊 Historial',
                    'Ver historial de activaciones.\n\nPróximamente...'
                  )}
                >
                  <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
                  <Text style={[styles.quickButtonText, { color: colors.primary }]}>Historial</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Alertas de esta laguna */}
            {laguna.alerts.length > 0 && (
              <View style={styles.lagunaAlerts}>
                <Text style={[styles.alertsTitle, { color: colors.textSecondary }]}>Alertas</Text>
                {laguna.alerts.map((alert, index) => (
                  <View key={index} style={styles.alertItem}>
                    <View style={[
                      styles.alertDot,
                      { backgroundColor: alert.status === 'critical' ? '#ef4444' : '#f59e0b' }
                    ]} />
                    <Text style={[styles.alertText, { color: colors.text }]}>{alert.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Datos crudos (expandido) */}
            {selectedLaguna === laguna.id && (
              <View style={[styles.rawDataSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.rawDataTitle, { color: colors.textSecondary }]}>Datos del ESP32</Text>
                <View style={[styles.rawDataContainer, { backgroundColor: colors.elevated }]}>
                  <Text style={[styles.rawDataText, { color: colors.textSecondary }]}>
                    {JSON.stringify(laguna.rawData, null, 2)}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        ))}

        {/* Reglas de Automatización */}
        <Card style={styles.section}>
          <CardHeader title="🤖 Reglas de Automatización" />
          <CardBody>
            <AutomationRule 
              icon="layers-outline"
              color="#3b82f6"
              title="Nivel de agua bajo"
              description="Enciende la bomba automáticamente y envía notificación"
              active
              colors={colors}
            />
            <AutomationRule 
              icon="thermometer-outline"
              color="#ef4444"
              title="Temperatura > 36°C"
              description="Enciende la bomba para regular y envía notificación"
              active
              colors={colors}
            />
            <AutomationRule 
              icon="water-outline"
              color="#14b8a6"
              title="Turbidez > 50 NTU"
              description="Envía notificación para cambiar o tratar el agua"
              active
              colors={colors}
            />
            <AutomationRule 
              icon="flask-outline"
              color="#8b5cf6"
              title="pH fuera de rango (6.5 - 8.5)"
              description="Envía notificación de alerta"
              active
              colors={colors}
            />
          </CardBody>
        </Card>

        {/* Información de sensores */}
        <Card style={styles.section}>
          <CardHeader title="📊 Rangos Óptimos (Tambaquí)" />
          <CardBody>
            <View style={[styles.rangeItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="thermometer-outline" size={18} color="#ef4444" />
              <View style={styles.rangeInfo}>
                <Text style={[styles.rangeTitle, { color: colors.text }]}>Temperatura</Text>
                <Text style={[styles.rangeValue, { color: colors.textSecondary }]}>25°C - 36°C (crítico: 38°C)</Text>
              </View>
            </View>
            <View style={[styles.rangeItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="flask-outline" size={18} color="#8b5cf6" />
              <View style={styles.rangeInfo}>
                <Text style={[styles.rangeTitle, { color: colors.text }]}>pH</Text>
                <Text style={[styles.rangeValue, { color: colors.textSecondary }]}>6.5 - 8.5 (crítico: 6.0 / 9.0)</Text>
              </View>
            </View>
            <View style={[styles.rangeItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="water-outline" size={18} color="#14b8a6" />
              <View style={styles.rangeInfo}>
                <Text style={[styles.rangeTitle, { color: colors.text }]}>Turbidez</Text>
                <Text style={[styles.rangeValue, { color: colors.textSecondary }]}>0 - 50 NTU (crítico: 100 NTU)</Text>
              </View>
            </View>
            <View style={[styles.rangeItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="layers-outline" size={18} color="#3b82f6" />
              <View style={styles.rangeInfo}>
                <Text style={[styles.rangeTitle, { color: colors.text }]}>Nivel de Agua</Text>
                <Text style={[styles.rangeValue, { color: colors.textSecondary }]}>Sensor digital (OK / BAJO)</Text>
              </View>
            </View>
          </CardBody>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// COMPONENTES
// ============================================

const AutomationRule = ({ icon, color, title, description, active, colors }) => (
  <View style={[styles.automationRule, { borderBottomColor: colors.border }]}>
    <View style={[styles.automationIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.automationContent}>
      <Text style={[styles.automationTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.automationDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
    <Ionicons 
      name={active ? 'checkmark-circle' : 'ellipse-outline'} 
      size={22} 
      color={active ? '#22c55e' : colors.textSecondary} 
    />
  </View>
);

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: SPACING.lg,
  },
  updateText: {
    fontSize: 12,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  // Loading & Empty
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  emptyHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontFamily: 'monospace',
  },
  // Laguna Card
  lagunaCard: {
    marginBottom: SPACING.lg,
  },
  cardWarning: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  cardCritical: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  lagunaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  lagunaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  lagunaIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lagunaName: {
    fontSize: 18,
    fontWeight: '600',
  },
  lagunaStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  // Sensors Grid
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  sensorCard: {
    flex: 1,
    minWidth: '22%',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderLeftWidth: 3,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sensorUnit: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  sensorLabel: {
    fontSize: 10,
  },
  sensorRange: {
    fontSize: 9,
    marginTop: 2,
  },
  // Bomba Section
  bombaSection: {
    padding: SPACING.sm,
  },
  bombaControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  bombaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bombaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bombaTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bombaStatus: {
    fontSize: 12,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  quickButtonActive: {
    backgroundColor: COLORS.primary[500],
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Laguna Alerts
  lagunaAlerts: {
    padding: SPACING.sm,
    paddingTop: 0,
  },
  alertsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertText: {
    fontSize: 12,
    flex: 1,
  },
  // Raw Data
  rawDataSection: {
    padding: SPACING.sm,
    borderTopWidth: 1,
  },
  rawDataTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  rawDataContainer: {
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  rawDataText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  // Automation Rules
  automationRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  automationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  automationContent: {
    flex: 1,
  },
  automationTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  automationDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  // Range Items
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  rangeInfo: {
    flex: 1,
  },
  rangeTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  rangeValue: {
    fontSize: 11,
  },
});

export default DevicesScreen;