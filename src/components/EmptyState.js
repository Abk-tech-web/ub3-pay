import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../config/theme';

export default function EmptyState({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(16) },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(2), textAlign: 'center', paddingHorizontal: spacing(8) },
});
