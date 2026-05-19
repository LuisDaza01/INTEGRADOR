// src/components/common/EmptyState.jsx
// Componente para estados vacíos

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import Button from './Button';

const EmptyState = ({
  icon = 'folder-open-outline',
  title = 'Sin datos',
  message = 'No hay información para mostrar',
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={COLORS.text.hint} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          fullWidth={false}
          style={styles.button}
        />
      )}
    </View>
  );
};

// Variantes predefinidas
export const EmptyOrders = ({ onAction }) => (
  <EmptyState
    icon="receipt-outline"
    title="Sin pedidos"
    message="Aún no tienes pedidos pendientes"
    actionLabel="Ver historial"
    onAction={onAction}
  />
);

export const EmptyAlerts = () => (
  <EmptyState
    icon="notifications-off-outline"
    title="Sin alertas"
    message="No hay alertas activas. ¡Todo está funcionando correctamente!"
  />
);

export const EmptySensors = () => (
  <EmptyState
    icon="hardware-chip-outline"
    title="Sin sensores"
    message="No hay sensores configurados para tu estanque"
  />
);

export const EmptyDevices = () => (
  <EmptyState
    icon="settings-outline"
    title="Sin dispositivos"
    message="No hay dispositivos IoT conectados"
  />
);

export const ErrorState = ({ message, onRetry }) => (
  <EmptyState
    icon="alert-circle-outline"
    title="Error"
    message={message || 'Ocurrió un error al cargar los datos'}
    actionLabel="Reintentar"
    onAction={onRetry}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
  button: {
    marginTop: SPACING.lg,
  },
});

export default EmptyState;
