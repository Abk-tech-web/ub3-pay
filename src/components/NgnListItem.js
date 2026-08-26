import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../config/theme';
import { formatNgn } from '../utils/formatters';

export default function NgnListItem({ balance, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.flagCircle}><Text style={{ fontSize: 20, color: '#008751', fontWeight: '800' }}>₦</Text></View>
      <View style={styles.info}>
        <Text style={styles.symbol}>NGN</Text>
        <Text style={styles.chainName}>Naira</Text>
      </View>
      <View style={styles.amounts}>
        <Text style={styles.balance}>{formatNgn(balance)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3) },
  pressed: { opacity: 0.6 },
  flagCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e6f4ea', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: spacing(3) },
  symbol: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  chainName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  balance: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
});
