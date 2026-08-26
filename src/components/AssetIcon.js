import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';
import TokenIcon from './TokenIcon';

export default function AssetIcon({ kind, symbol, size = 42 }) {
  const wrap = { width: size, height: size, borderRadius: size / 2 };

  if (kind === 'bank') {
    return (
      <View style={[styles.circle, wrap, { backgroundColor: colors.violetSoft + '22' }]}>
        <Ionicons name="business" size={size * 0.5} color={colors.violet} />
      </View>
    );
  }
  if (kind === 'swap') {
    return (
      <View style={[styles.circle, wrap, { backgroundColor: colors.violetSoft + '22' }]}>
        <Ionicons name="swap-horizontal" size={size * 0.5} color={colors.violet} />
      </View>
    );
  }

  return <TokenIcon symbol={(symbol || '').toUpperCase()} size={size} />;
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
