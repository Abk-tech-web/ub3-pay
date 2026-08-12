import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../config/theme';
import { formatUsd, formatCrypto } from '../utils/formatters';
import { getChain } from '../config/chains';

export default function AssetListItem({ asset, onPress }) {
  const chain = getChain(asset.chainId);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Text style={styles.iconLetter}>{asset.symbol.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.symbol}>{asset.symbol}</Text>
        <Text style={styles.chainName}>{chain?.name ?? asset.chainId}</Text>
      </View>
      <View style={styles.amounts}>
        <Text style={styles.balance}>{formatCrypto(asset.balance, '')}</Text>
        <Text style={styles.usd}>{formatUsd(asset.usdValue)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3) },
  pressed: { opacity: 0.6 },
  iconWrap: {
    width: 40, height: 40, borderRadius: radii.pill,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconLetter: { color: colors.violetSoft, fontWeight: '700' },
  info: { flex: 1, marginLeft: spacing(3) },
  symbol: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  chainName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amounts: { alignItems: 'flex-end' },
  balance: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  usd: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
