import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../config/theme';
import { formatUsd, formatCrypto } from '../utils/formatters';
import { getChain } from '../config/chains';
import TokenIcon from './TokenIcon';

export default function AssetListItem({ asset, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const chain = getChain(asset.chainId);
  const change = asset.change24h ?? 0;
  const isUp = change >= 0;
  const price = asset.price ?? (asset.balance ? asset.usdValue / asset.balance : 0);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <TokenIcon symbol={asset.symbol} size={40} />
      <View style={styles.info}>
        <Text style={styles.symbol}>{asset.symbol}</Text>
        <Text style={styles.chainName}>{asset.networkCount > 1 ? `${asset.networkCount} Networks` : (chain?.name ?? asset.chainId)}</Text>
            <Text style={styles.price}>{formatUsd(price)}</Text>
      </View>
      <View style={styles.amounts}>
        <Text style={styles.balance}>{formatCrypto(asset.balance, '')}</Text>
        <View style={styles.usdRow}>
          <Text style={styles.usd}>{formatUsd(asset.usdValue)}</Text>
          <Text style={[styles.change, { color: isUp ? '#34d399' : '#f87171' }]}>
            {isUp ? '+' : ''}{change.toFixed(2)}%
          </Text>
        </View>
        {asset.pnl24hUsd != null && asset.pnl24hUsd !== 0 && (
          <Text style={[styles.pnl, { color: isUp ? '#34d399' : '#f87171' }]}>
            {isUp ? '+' : ''}{formatUsd(asset.pnl24hUsd)} today
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const getStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3) },
  pressed: { opacity: 0.6 },
  info: { flex: 1, marginLeft: spacing(3) },
  symbol: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  chainName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  price: { color: colors.textSecondary, fontSize: 12, marginTop: 1, fontWeight: '600' },
  amounts: { alignItems: 'flex-end' },
  balance: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  usdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: 2 },
  usd: { color: colors.textSecondary, fontSize: 12 },
  change: { fontSize: 11, fontWeight: '700' },
  pnl: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
