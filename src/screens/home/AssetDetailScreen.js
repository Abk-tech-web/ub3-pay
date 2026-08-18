import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { formatUsd, formatCrypto } from '../../utils/formatters';
import { getChain } from '../../config/chains';

export default function AssetDetailScreen({ route, navigation }) {
  const { asset } = route.params ?? {};
  const chain = getChain(asset?.chainId);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.symbol}>{asset?.symbol}</Text>
        <Text style={styles.chainName}>{chain?.name}</Text>
        <Text style={styles.balance}>{formatCrypto(asset?.balance, asset?.symbol)}</Text>
        <Text style={styles.usd}>{formatUsd(asset?.usdValue)}</Text>

        <View style={styles.row}>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('ReceiveAddress', { chainId: asset?.chainId, symbol: asset?.symbol })}>
            <Text style={styles.actionLabel}>Receive</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Send', { chainId: asset?.chainId, symbol: asset?.symbol })}>
            <Text style={styles.actionLabel}>Send</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('SwapTab', { screen: 'SwapCryptoToNaira', params: { symbol: asset?.symbol } })}>
            <Text style={styles.actionLabel}>Swap to NGN</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  symbol: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  chainName: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  balance: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginTop: spacing(8) },
  usd: { color: colors.textSecondary, fontSize: 15, marginTop: spacing(1) },
  row: { flexDirection: 'row', marginTop: spacing(8), gap: spacing(3) },
  actionBtn: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, paddingVertical: spacing(4), alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionLabel: { color: colors.violetSoft, fontWeight: '700', fontSize: 13 },
});
