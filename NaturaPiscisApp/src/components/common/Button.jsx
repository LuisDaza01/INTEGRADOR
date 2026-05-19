// src/components/common/Button.jsx
// Componente de botón reutilizable

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, danger, success, ghost
  size = 'md', // sm, md, lg
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
        };
      case 'outline':
        return {
          button: styles.outlineButton,
          text: styles.outlineText,
        };
      case 'danger':
        return {
          button: styles.dangerButton,
          text: styles.primaryText,
        };
      case 'success':
        return {
          button: styles.successButton,
          text: styles.primaryText,
        };
      case 'ghost':
        return {
          button: styles.ghostButton,
          text: styles.ghostText,
        };
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: styles.smallButton,
          text: styles.smallText,
        };
      case 'lg':
        return {
          button: styles.largeButton,
          text: styles.largeText,
        };
      default:
        return {
          button: styles.mediumButton,
          text: styles.mediumText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  const iconColor = variant === 'outline' || variant === 'ghost' 
    ? COLORS.primary[500] 
    : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={20} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={[variantStyles.text, sizeStyles.text, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={20} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary[500],
    ...SHADOWS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.background.elevated,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary[500],
  },
  dangerButton: {
    backgroundColor: COLORS.error.main,
  },
  successButton: {
    backgroundColor: COLORS.success.main,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },

  // Text variants
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryText: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  outlineText: {
    color: COLORS.primary[500],
    fontWeight: '600',
  },
  ghostText: {
    color: COLORS.primary[500],
    fontWeight: '500',
  },

  // Sizes
  smallButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  mediumButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  largeButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Icons
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});

export default Button;
