// src/components/common/Input.jsx
// Componente de input reutilizable — Diseño futurista con glassmorphism, borde neón dinámico y tipografía SpaceGrotesk

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  helperText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  neonColor,
  variant = 'glass', // glass | outline | default
  ...props
}) => {
  const { colors, isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animaciones para micro-interacciones
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      useNativeDriver: false, // Color borders y shadows no soportan native driver
    }).start();
  }, [isFocused]);

  const isPassword = secureTextEntry;

  // Colores dinámicos
  const nc = neonColor || colors.neonCyan || '#00F5FF';
  const errColor = colors.error || '#ef4444';
  const activeBorderColor = error ? errColor : nc;

  // Interpolación de estilos para el borde y sombra
  const borderColorInterpolated = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? errColor : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'),
      activeBorderColor
    ]
  });

  const bgInterpolated = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? 'rgba(10,15,30,0.65)' : 'rgba(255,255,255,0.8)',
      isDarkMode ? 'rgba(10,15,30,0.85)' : 'rgba(255,255,255,0.95)'
    ]
  });

  const shadowOpacityInterpolated = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isDarkMode ? 0.35 : 0.12]
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: isFocused
                ? activeBorderColor
                : (isDarkMode ? colors.text : 'rgba(0,0,0,0.7)'),
              fontFamily: 'SpaceGrotesk-Medium',
            }
          ]}
        >
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: bgInterpolated,
            borderColor: borderColorInterpolated,
            shadowColor: activeBorderColor,
            shadowOpacity: shadowOpacityInterpolated,
            shadowRadius: isFocused ? 10 : 0,
            shadowOffset: { width: 0, height: isFocused ? 2 : 0 },
            elevation: isFocused ? 4 : 0,
          },
          !editable && { opacity: 0.5, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={
              error
                ? errColor
                : isFocused
                ? activeBorderColor
                : colors.textMuted || '#94a3b8'
            }
            style={styles.icon}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted || '#94a3b8'}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: 'SpaceGrotesk-Regular',
            },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={
                isFocused
                  ? activeBorderColor
                  : colors.textMuted || '#94a3b8'
              }
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? errColor : (colors.textMuted || '#94a3b8'),
              fontFamily: 'SpaceGrotesk-Regular',
            }
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helperText: {
    fontSize: 11.5,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
});

export default Input;
