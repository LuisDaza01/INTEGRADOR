import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FishRefreshControl = ({ refreshing, onRefresh, tintColor = '#38bdf8' }) => {
  const swimX  = useRef(new Animated.Value(0)).current;
  const swimY  = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (refreshing) {
      // Horizontal swim loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(swimX, { toValue: 20, duration: 400, useNativeDriver: true }),
          Animated.timing(swimX, { toValue: -20, duration: 400, useNativeDriver: true }),
        ])
      ).start();
      // Vertical bob
      Animated.loop(
        Animated.sequence([
          Animated.timing(swimY, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(swimY, { toValue: 5, duration: 300, useNativeDriver: true }),
        ])
      ).start();
      // Pulse scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      swimX.stopAnimation();
      swimY.stopAnimation();
      scale.stopAnimation();
      Animated.parallel([
        Animated.spring(swimX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(swimY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 0.8, useNativeDriver: true }),
      ]).start();
    }
  }, [refreshing]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
      progressViewOffset={0}
      title=""
    >
      {/* Custom indicator overlay rendered above content when pulling */}
    </RefreshControl>
  );
};

// Animated fish indicator — rendered inline at the top of the scroll view
export const FishIndicator = ({ visible, color = '#38bdf8' }) => {
  const swimX  = useRef(new Animated.Value(0)).current;
  const swimY  = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      Animated.loop(Animated.sequence([
        Animated.timing(swimX, { toValue: 12, duration: 350, useNativeDriver: true }),
        Animated.timing(swimX, { toValue: -12, duration: 350, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(swimY, { toValue: -4, duration: 280, useNativeDriver: true }),
        Animated.timing(swimY, { toValue: 4, duration: 280, useNativeDriver: true }),
      ])).start();
    } else {
      swimX.stopAnimation();
      swimY.stopAnimation();
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[s.indicator, { opacity, transform: [{ scale }] }]}>
      <View style={[s.bubble, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}>
        <Animated.View style={{ transform: [{ translateX: swimX }, { translateY: swimY }] }}>
          <Ionicons name="fish" size={28} color={color} />
        </Animated.View>
        <Text style={[s.label, { color }]}>Actualizando...</Text>
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  indicator: {
    alignItems: 'center', paddingVertical: 12,
  },
  bubble: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '600' },
});

export default FishRefreshControl;
