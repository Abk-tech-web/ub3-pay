import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

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
          <Ionicons name={icon} size={26} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

export default function NairaDetailScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { portfolio } = useWallet();
  const ngnBalance = portfolio.ngnBalance;

  const goToSwap = () => {
    navigation.navigate('SwapTab', {
      screen: 'Swap',
      params: { symbol: 'NGN' },
    });
  };

  const balanceText = (ngnBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Naira</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.body}>
        <Reveal delay={40}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NGN</Text>
            </View>
            <Text style={styles.heroLabel}>Naira balance</Text>
            <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
              {'\u20A6'} {balanceText}
            </Text>
          </View>
        </Reveal>

        <Reveal delay={150} style={styles.actionsRow}>
          <Tile label="Withdraw" icon="arrow-up" styles={styles} onPress={() => navigation.navigate('NairaWithdraw')} />
          <Tile
            label="Deposit"
            icon="arrow-down"
            styles={styles}
            onPress={() => navigation.navigate('NairaTab', { screen: 'NairaAccount' })}
          />
          <Tile label="Swap" icon="swap-horizontal" styles={styles} onPress={goToSwap} />
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  body: { flex: 1, padding: 20, paddingTop: 12 },
  hero: {
    backgroundColor: '#4C1D95', borderRadius: 28, paddingVertical: 32, paddingHorizontal: 20,
    alignItems: 'center', overflow: 'hidden',
    shadowColor: '#2a1260', shadowOpacity: 0.35, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -50, width: 190, height: 190,
    borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.09)',
  },
  badge: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  badgeText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  heroLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  heroAmount: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 6, maxWidth: '100%' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 34 },
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
  tileLabel: { marginTop: 10, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
