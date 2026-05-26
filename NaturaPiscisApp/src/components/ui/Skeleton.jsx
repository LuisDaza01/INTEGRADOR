// src/components/ui/Skeleton.jsx
// Componentes skeleton de carga — Estilo futurista con shimmer neón

import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

const Skeleton = ({ width = '100%', height = 14, borderRadius = 7, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1100, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 1100, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(0,245,255,0.03)', 'rgba(0,245,255,0.09)', 'rgba(0,245,255,0.03)'],
  });

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: bg }, style]} />
  );
};

export const SkeletonProductCard = () => (
  <View style={s.productCard}>
    <Skeleton height={110} borderRadius={0} style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
    <View style={{ padding: 10 }}>
      <Skeleton height={12} width="80%" style={{ marginBottom: 6 }} />
      <Skeleton height={10} width="50%" style={{ marginBottom: 10 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton height={14} width={50} />
        <Skeleton width={26} height={26} borderRadius={8} />
      </View>
    </View>
  </View>
);

export const SkeletonProductorCard = () => (
  <View style={s.productorCard}>
    <Skeleton height={100} borderRadius={0} style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
    <View style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1 }}>
          <Skeleton height={12} width="60%" style={{ marginBottom: 5 }} />
          <Skeleton height={10} width="40%" />
        </View>
      </View>
      <Skeleton height={10} style={{ marginBottom: 5 }} />
      <Skeleton height={10} width="70%" />
    </View>
  </View>
);

export const SkeletonOrderCard = () => (
  <View style={s.orderCard}>
    {/* Shimmer line neón en la parte superior */}
    <View style={s.orderShimmerLine} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1 }}>
        <Skeleton height={13} width="55%" style={{ marginBottom: 6 }} />
        <Skeleton height={10} width="35%" />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Skeleton height={20} width={70} borderRadius={10} />
        <Skeleton height={12} width={50} />
      </View>
    </View>
  </View>
);

export const SkeletonStatCard = () => (
  <View style={s.statCard}>
    <Skeleton width={36} height={36} borderRadius={18} style={{ marginBottom: 8 }} />
    <Skeleton height={20} width="60%" style={{ marginBottom: 5 }} />
    <Skeleton height={11} width="40%" />
  </View>
);

export const SkeletonList = ({ count = 4, Component = SkeletonOrderCard }) => (
  <>
    {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
  </>
);

const s = StyleSheet.create({
  productCard: {
    width: 158, borderRadius: 18, overflow: 'hidden', marginRight: 12,
    backgroundColor: 'rgba(10,15,30,0.65)',
    borderWidth: 1, borderColor: 'rgba(0,245,255,0.08)',
  },
  productorCard: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 12,
    backgroundColor: 'rgba(10,15,30,0.65)',
    borderWidth: 1, borderColor: 'rgba(0,245,255,0.08)',
  },
  orderCard: {
    padding: 14, borderRadius: 18, marginBottom: 10, overflow: 'hidden',
    backgroundColor: 'rgba(10,15,30,0.65)',
    borderWidth: 1, borderColor: 'rgba(0,245,255,0.08)',
  },
  orderShimmerLine: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 1,
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  statCard: {
    flex: 1, minWidth: '45%', padding: 14, borderRadius: 18, alignItems: 'center',
    backgroundColor: 'rgba(10,15,30,0.65)',
    borderWidth: 1, borderColor: 'rgba(0,245,255,0.08)',
  },
});

export default Skeleton;
