// src/components/common/Card.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

export const Card = ({
  children,
  variant = 'default', // default | elevated | outlined | glass
  onPress,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const Component = onPress ? TouchableOpacity : View;

  const variantStyle = (() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          borderWidth: 0,
          shadowColor: colors.glowColor || '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
          elevation: 8,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.cardBorder,
          borderWidth: 1.5,
        };
      case 'glass':
        return {
          backgroundColor: colors.cardGlass || 'rgba(255,255,255,0.1)',
          borderColor: colors.cardGlassBorder || colors.cardBorder,
          borderWidth: 1,
          shadowColor: colors.glowColor || '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.30,
          shadowRadius: 18,
          elevation: 10,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderWidth: 1,
        };
    }
  })();

  return (
    <Component
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, variantStyle, style]}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ children, title, subtitle, action, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        {children}
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
};

export const CardBody = ({ children, style }) => (
  <View style={[styles.body, style]}>{children}</View>
);

export const CardFooter = ({ children, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: colors.divider }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  action: {
    marginLeft: SPACING.sm,
  },
  body: {
    marginVertical: SPACING.xs,
  },
  footer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
});

export default Card;
