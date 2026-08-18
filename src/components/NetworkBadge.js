import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../config/theme';

export default function NetworkBadge({ label }) {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated, borderRadius: radii.pill,
    paddingHorizontal: spacing(3), paddingVertical: spacing(1.5),
    borderWidth: 1, borderColor: colors.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.violet, marginRight: spacing(1.5) },
  text: { color: colors.chromeDim, fontSize: 11, fontWeight: '600' },
});
