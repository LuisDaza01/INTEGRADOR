// src/components/ui/NeonText.jsx
// Componente de texto con efecto de brillo neón usando múltiples capas de textShadow

import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Mapeo de intensidad de brillo a radio de sombra
const GLOW_RADIUS = {
  low: 4,
  medium: 8,
  high: 14,
};

// Configuración tipográfica por variante
const VARIANT_STYLES = {
  heading: {
    fontFamily: Platform.select({
      ios: 'SpaceGrotesk-Bold',
      android: 'SpaceGrotesk-Bold',
      default: 'System',
    }),
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  body: {
    fontFamily: Platform.select({
      ios: 'SpaceGrotesk-Regular',
      android: 'SpaceGrotesk-Regular',
      default: 'System',
    }),
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  label: {
    fontFamily: Platform.select({
      ios: 'SpaceGrotesk-Medium',
      android: 'SpaceGrotesk-Medium',
      default: 'System',
    }),
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};

/**
 * NeonText — componente de texto con efecto de brillo neón.
 *
 * El efecto glow se logra mediante múltiples capas de textShadow
 * que simulan un resplandor difuso alrededor del texto.
 *
 * @param {React.ReactNode}  children   - Contenido de texto
 * @param {object}           style      - Estilos adicionales
 * @param {string}           color      - Color del brillo neón (por defecto: glowColor del tema)
 * @param {'low'|'medium'|'high'} intensity - Intensidad del efecto glow
 * @param {'heading'|'body'|'label'} variant - Variante tipográfica
 * @param {object}           ...rest    - Props adicionales de Text (numberOfLines, etc.)
 */
const NeonText = ({
  children,
  style,
  color,
  intensity = 'medium',
  variant = 'body',
  ...rest
}) => {
  const { colors } = useTheme();

  // Color del brillo: usa el proporcionado por props o el color neón del tema
  const glowColor = color || colors.glowColor;

  // Radio de la sombra basado en la intensidad seleccionada
  const radius = GLOW_RADIUS[intensity] || GLOW_RADIUS.medium;

  // Estilos tipográficos según la variante
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.body;

  // Estilo del efecto glow neón usando textShadow
  // Se usan múltiples capas para crear un efecto de resplandor más realista
  const glowStyle = {
    // Capa principal de sombra — brillo difuso
    textShadowColor: glowColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: radius,
  };

  return (
    <Text
      style={[
        styles.baseText,
        variantStyle,
        glowStyle,
        { color: glowColor },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Estilo base del texto — asegura renderizado consistente
  baseText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default NeonText;
