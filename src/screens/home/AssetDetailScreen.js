import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { formatUsd, formatCrypto } from '../../utils/formatters';
import { getChain, getNetworksForSymbol } from '../../config/chains';
import NetworkPills from '../../components/NetworkPills';
import TokenIcon from '../../components/TokenIcon';
import PriceChart from '../../components/PriceChart';

function Reveal({ delay = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

function Tile({ label, icon, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tileWrap, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
    >
      <View style={styles.tileShadow}>
        <LinearGradient colors={['#8B5CF6', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
          <View style={styles.tileShine} />
          <Feather name={icon} size={24} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

export default function AssetDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { asset } = route.params ?? {};
  const chain = getChain(asset?.chainId);

  const onReceive = () => {
    const nets = getNetworksForSymbol(asset?.symbol);
    if (nets.length > 1) {
      navigation.navigate('ReceiveNetwork', { symbol: asset?.symbol });
    } else {
      navigation.navigate('ReceiveAddress', { chainId: asset?.chainId, symbol: asset?.symbol });
    }
  };

  const onSend = () => {
    const nets = getNetworksForSymbol(asset?.symbol);
    if (nets.length > 1) {
      navigation.navigate('NetworkPicker', { symbol: asset?.symbol, networks: nets, targetRoute: 'SendAmount' });
    } else {
      navigation.navigate('SendAmount', { chainId: asset?.chainId, symbol: asset?.symbol });
    }
  };

  const onSwap = () => {
    navigation.navigate('SwapTab', { screen: 'Swap', params: { symbol: asset?.symbol } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#2a1f4d', colors.bg]} style={styles.glow} />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>

        <Reveal delay={0} style={styles.center}>
          <View style={styles.iconWrap}>
            <TokenIcon symbol={asset?.symbol} chainId={asset?.chainId} size={64} />
          </View>
          <Text style={styles.symbol}>{asset?.symbol}</Text>
          {asset?.chainIds && asset.chainIds.length > 1 ? (
            <NetworkPills chainIds={asset.chainIds} center />
          ) : (
            <Text style={styles.chainName}>
              {asset?.networkCount > 1 ? asset.networkCount + ' Networks' : chain?.name}
            </Text>
          )}
        </Reveal>

        <Reveal delay={90}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <Text style={styles.heroLabel}>Your balance</Text>
            <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCrypto(asset?.balance, asset?.symbol)}
            </Text>
            <View style={styles.usdPill}>
              <Text style={styles.usdText}>{formatUsd(asset?.usdValue)}</Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={170} style={styles.chartWrap}>
          <PriceChart symbol={asset?.symbol} />
        </Reveal>

        <Reveal delay={240} style={styles.actionsRow}>
          <Tile label="Receive" icon="arrow-down-left" styles={styles} onPress={onReceive} />
          <Tile label="Send" icon="send" styles={styles} onPress={onSend} />
          <Tile label="Swap to NGN" icon="repeat" styles={styles} onPress={onSwap} />
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320, opacity: 0.5 },
  body: { padding: spacing(5), paddingBottom: 150 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing(2),
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  center: { alignItems: 'center' },
  iconWrap: {
    width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  symbol: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: spacing(3) },
  chainName: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  hero: {
    marginTop: spacing(5), backgroundColor: '#4C1D95', borderRadius: 28,
    paddingVertical: 26, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden',
    shadowColor: '#2a1260', shadowOpacity: 0.35, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -50, width: 190, height: 190,
    borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  heroAmount: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6, maxWidth: '100%' },
  usdPill: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 16,
  },
  usdText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  chartWrap: { marginTop: spacing(5) },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing(7) },
  tileWrap: { alignItems: 'center', width: '30%' },
  tileShadow: {
    borderRadius: 24,
    shadowColor: '#2a1260', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  tile: {
    width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  tileShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tileLabel: { marginTop: 10, fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
});
