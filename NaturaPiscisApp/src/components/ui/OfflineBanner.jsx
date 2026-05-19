// src/components/ui/OfflineBanner.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Shows a subtle banner when the app is displaying stale cached data.
 * Pass `visible={isStale}` from useOfflineCache.
 */
export const OfflineBanner = ({ visible }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [-8, 0] }) }] }]}>
      <Ionicons name="cloud-offline-outline" size={13} color="#fb923c" />
      <Text style={styles.text}>Mostrando datos guardados (sin conexión)</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(251,146,60,0.12)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(251,146,60,0.25)',
    paddingVertical: 6, paddingHorizontal: 16,
  },
  text: { fontSize: 12, color: '#fb923c', fontWeight: '500' },
});

export default OfflineBanner;
