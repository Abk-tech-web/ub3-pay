import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radii, spacing } from '../config/theme';

export default function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.violet : colors.bg} />
      ) : (
        <Text style={[styles.label, isGhost && styles.ghostLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
    marginBottom: 90,
  },
  primary: { backgroundColor: colors.violet },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.violet },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  ghostLabel: { color: colors.violetSoft },
});
