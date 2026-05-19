// src/components/common/OfflineBanner.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OfflineBanner = ({ visible }) => {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -60,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY }] }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={s.text}>Sin conexión — mostrando datos guardados</Text>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          9999,
    backgroundColor: '#EF4444',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 10,
    paddingTop:      46,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default OfflineBanner;
