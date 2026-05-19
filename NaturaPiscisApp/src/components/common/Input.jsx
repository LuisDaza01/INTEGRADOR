// src/components/common/Input.jsx
// Componente de input reutilizable

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

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
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
          !editable && styles.disabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? COLORS.error.main : COLORS.text.secondary}
            style={styles.icon}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.hint}
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
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
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
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  focused: {
    borderColor: COLORS.primary[500],
  },
  error: {
    borderColor: COLORS.error.main,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: COLORS.background.elevated,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error.main,
  },
});

export default Input;
