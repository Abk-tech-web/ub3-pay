import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../config/theme';
import { formatUsd, formatNgn } from '../utils/formatters';

export default function BalanceCard({ totalUsd, totalNgn }) {
  const [hidden, setHidden] = useState(false);
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Total balance</Text>
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>
      <Text style={styles.primaryAmount}>{hidden ? '••••••' : formatUsd(totalUsd)}</Text>
      <Text style={styles.secondaryAmount}>{hidden ? '••••••' : formatNgn(totalNgn)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing(6),
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.textSecondary, fontSize: 13 },
  toggle: { color: colors.violetSoft, fontSize: 13, fontWeight: '600' },
  primaryAmount: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', marginTop: spacing(2) },
  secondaryAmount: { color: colors.textSecondary, fontSize: 15, marginTop: spacing(1) },
});
