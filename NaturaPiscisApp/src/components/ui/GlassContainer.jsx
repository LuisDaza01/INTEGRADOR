// src/components/ui/GlassContainer.jsx
// Contenedor futurista con efecto glassmorphism, brillo neón y animaciones opcionales

import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

// Ancho de pantalla para calcular la animación del shimmer
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mapeo de intensidad a opacidad del fondo glass
const INTENSITY_OPACITY = {
  light: 0.5,
  medium: 0.72,
  heavy: 0.88,
};

/**
 * GlassContainer — contenedor reutilizable con efecto glassmorphism.
 *
 * @param {React.ReactNode}  children    - Contenido hijo del contenedor
 * @param {object}           style       - Estilos adicionales
 * @param {'light'|'medium'|'heavy'} intensity - Controla la opacidad del fondo glass
 * @param {boolean}          borderGlow  - Activa el borde con brillo neón
 * @param {string}           neonColor   - Color personalizado para el brillo neón
 * @param {boolean}          animated    - Activa la animación de pulso en el borde
 */
const GlassContainer = ({
  children,
  style,
  intensity = 'medium',
  borderGlow = false,
  neonColor,
  animated = false,
}) => {
  const { colors, isDarkMode } = useTheme();

  // Referencia para la animación del shimmer (desplazamiento horizontal)
  const shimmerAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  // Referencia para la animación de pulso del borde
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Color neón: usa el proporcionado por props o el color de brillo del tema
  const resolvedNeonColor = neonColor || colors.glowColor;

  // Opacidad basada en la intensidad seleccionada
  const opacity = INTENSITY_OPACITY[intensity] || INTENSITY_OPACITY.medium;

  useEffect(() => {
    // Animación de shimmer: línea brillante que se desplaza de izquierda a derecha
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: SCREEN_WIDTH,
        duration: 2400,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    // Animación de pulso: opacidad del borde que oscila suavemente
    let pulseLoop;
    if (animated) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    }

    // Limpiar animaciones al desmontar el componente
    return () => {
      shimmerLoop.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, [animated]);

  // Interpolar la opacidad del borde para la animación de pulso
  const borderOpacity = animated
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
      })
    : 1;

  // Colores del gradiente glass según el tema (claro u oscuro)
  const glassGradientColors = isDarkMode
    ? [
        `rgba(13, 25, 41, ${opacity})`,
        `rgba(17, 30, 51, ${opacity * 0.9})`,
      ]
    : [
        `rgba(255, 255, 255, ${opacity})`,
        `rgba(240, 253, 244, ${opacity * 0.9})`,
      ];

  // Estilo dinámico del borde con brillo neón
  const borderStyle = borderGlow
    ? {
        borderWidth: 1.5,
        borderColor: resolvedNeonColor,
        // Sombra para simular el efecto glow alrededor del borde
        shadowColor: resolvedNeonColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      }
    : {
        borderWidth: 1,
        borderColor: colors.cardGlassBorder,
      };

  return (
    <Animated.View
      style={[
        styles.container,
        borderStyle,
        // Aplicar opacidad animada al borde si la animación está activa
        animated && { opacity: borderOpacity },
        style,
      ]}
    >
      {/* Fondo con gradiente glass */}
      <LinearGradient
        colors={glassGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Línea shimmer animada en la parte superior */}
      <Animated.View
        style={[
          styles.shimmerLine,
          {
            backgroundColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(255, 255, 255, 0.35)',
            transform: [{ translateX: shimmerAnim }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Contenido hijo del componente */}
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal con esquinas redondeadas y overflow oculto
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  // Línea de shimmer: barra fina en la parte superior del contenedor
  shimmerLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 2,
    borderRadius: 1,
  },
});

export default GlassContainer;
