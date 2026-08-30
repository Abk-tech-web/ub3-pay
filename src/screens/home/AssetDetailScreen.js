import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { formatUsd, formatCrypto } from '../../utils/formatters';
import { getChain, getNetworksForSymbol } from '../../config/chains';
import TokenIcon from '../../components/TokenIcon';
import PriceChart from '../../components/PriceChart';

const ACTIONS_META = {
  Receive: { icon: 'arrow-down-left', gradient: ['#34d399', '#059669'] },
  Send: { icon: 'send', gradient: ['#60a5fa', '#2563eb'] },
  'Swap to NGN': { icon: 'repeat', gradient: ['#a78bfa', '#7c3aed'] },
};

function ActionPill({ label, onPress, styles }) {
  const meta = ACTIONS_META[label];
  return (
    <Pressable style={styles.actionWrap} onPress={onPress}>
      <LinearGradient colors={meta.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionCircle}>
        <Feather name={meta.icon} size={20} color="#fff" />
      </LinearGradient>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function AssetDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { asset } = route.params ?? {};
  const chain = getChain(asset?.chainId);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#2a1f4d', colors.bg]} style={styles.glow} />
      <View style={styles.body}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <TokenIcon symbol={asset?.symbol} chainId={asset?.chainId} size={64} />
          </View>
          <Text style={styles.symbol}>{asset?.symbol}</Text>
          <Text style={styles.chainName}>{chain?.name}</Text>

          <Text style={styles.balance}>{formatCrypto(asset?.balance, asset?.symbol)}</Text>
          <Text style={styles.usd}>{formatUsd(asset?.usdValue)}</Text>
        </View>

          <PriceChart symbol={asset?.symbol} />

        <View style={styles.actionsRow}>
          <ActionPill styles={styles}
            label="Receive"
            onPress={() => {
              const nets = getNetworksForSymbol(asset?.symbol);
              if (nets.length > 1) {
                navigation.navigate('ReceiveNetwork', { symbol: asset?.symbol });
              } else {
                navigation.navigate('ReceiveAddress', { chainId: asset?.chainId, symbol: asset?.symbol });
              }
            }}
          />
          <ActionPill styles={styles}
            label="Send"
            onPress={() => navigation.navigate('Send', { chainId: asset?.chainId, symbol: asset?.symbol })}
          />
          <ActionPill styles={styles}
            label="Swap to NGN"
            onPress={() => navigation.navigate('SwapTab', { screen: 'Swap', params: { symbol: asset?.symbol } })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320, opacity: 0.5 },
  body: { flex: 1, padding: spacing(5) },
  backBtn: {
    width: 38, height: 38, borderRadius: 14, backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing(4),
  },
  center: { alignItems: 'center', marginTop: spacing(4) },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1c1c22', borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.violet, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  symbol: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: spacing(4) },
  chainName: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  balance: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', marginTop: spacing(6) },
  usd: { color: colors.textSecondary, fontSize: 15, marginTop: spacing(1) },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing(9) },
  actionWrap: { alignItems: 'center', width: '30%' },
  actionCircle: {
    width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6, marginBottom: spacing(2),
  },
  actionLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
