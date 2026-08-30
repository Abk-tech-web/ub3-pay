import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing } from '../config/theme';

export default function PasswordInput({ value, onChangeText, placeholder = '••••••••', style }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={!visible}
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10} style={styles.eyeBtn}>
        <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, height: 52,
  },
  input: { flex: 1, color: colors.textPrimary, paddingHorizontal: spacing(4), height: '100%' },
  eyeBtn: { paddingHorizontal: spacing(4) },
});
