import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import { truncateAddress } from '../../utils/formatters';
import { getChain } from '../../config/chains';
import SkeletonLoader from '../../components/SkeletonLoader';
import TokenIcon from '../../components/TokenIcon';

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

export default function ReceiveScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const chain = getChain(chainId);
  const { user } = useAuth();
  const [address, setAddress] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const UNSUPPORTED_CHAINS = ['bitcoin', 'litecoin', 'tron', 'xrp', 'ton', 'sui'];
  const qrScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.spring(qrScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    if (UNSUPPORTED_CHAINS.includes(chainId)) {
      setError('not_supported');
      return undefined;
    }
    setError(null);
    setAddress(null);
    const timeout = setTimeout(() => setError('timeout'), 25000);
    walletService.getDepositAddress(user.uid, chainId)
      .then((r) => { clearTimeout(timeout); setAddress(r.address); })
      .catch(() => { clearTimeout(timeout); setError('failed'); });
    return () => clearTimeout(timeout);
  }, [user, chainId]);

  const copy = () => {
    if (!address) return;
    Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    if (!address) return;
    Share.share({ message: address });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#2a1f4d', colors.bg]} style={styles.glow} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.iconRing}>
            <TokenIcon symbol={symbol} chainId={chainId} size={40} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.title}>Receive {symbol}</Text>
            <Text style={styles.chainTag}>{'on ' + (chain && chain.name ? chain.name : 'this network')}</Text>
          </View>
        </View>

        <Reveal delay={60} style={{ width: '100%' }}>
          <View style={styles.warning}>
            <Feather name="alert-triangle" size={15} color="#D97706" />
            <Text style={styles.warningText}>
              {'Only send ' + symbol + ' on ' + (chain && chain.name ? chain.name : 'this network') + ' to this address'}
            </Text>
          </View>
        </Reveal>

        <Animated.View style={[styles.qrCard, { transform: [{ scale: qrScale }] }]}>
          <LinearGradient
            colors={[colors.violet, colors.violetDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrBorder}
          >
            <View style={styles.qrInner}>
              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={32} color="#f87171" />
                  <Text style={styles.errorText}>
                    {error === 'not_supported' ? symbol + ' deposits are not supported yet' : 'Could not load address. Pull to retry.'}
                  </Text>
                </View>
              ) : address ? (
                <QRCode
                  value={address}
                  size={200}
                  ecl="H"
                  backgroundColor="#fff"
                  color="#12062e"
                  logo={require('../../../assets/icon.png')}
                  logoSize={46}
                  logoMargin={4}
                  logoBackgroundColor="#fff"
                  logoBorderRadius={12}
                />
              ) : (
                <SkeletonLoader width={200} height={200} />
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Reveal delay={160} style={{ width: '100%', alignItems: 'center' }}>
          <Pressable onPress={copy} style={styles.addressRow}>
            <Text style={styles.address}>{address ? truncateAddress(address, 12, 10) : ''}</Text>
          </Pressable>
        </Reveal>

        <Reveal delay={230} style={styles.btnRow}>
          <Pressable
            onPress={copy}
            style={({ pressed }) => [styles.copyWrap, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <LinearGradient colors={['#8B5CF6', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.copyBtn}>
              <Feather name={copied ? 'check' : 'copy'} size={17} color="#fff" />
              <Text style={styles.copyLabel}>{copied ? 'Copied!' : 'Copy address'}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={share}
            style={({ pressed }) => [styles.shareBtn, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
          >
            <Feather name="share-2" size={18} color={colors.violet} />
          </Pressable>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, opacity: 0.5 },
  body: { flex: 1, padding: 24, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 8 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  iconRing: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  title: { color: colors.textPrimary, fontSize: 21, fontWeight: '800' },
  chainTag: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  warning: {
    flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 20,
    backgroundColor: 'rgba(245,158,11,0.14)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.45)',
    borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14,
  },
  warningText: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '600', flex: 1, marginLeft: 8 },
  qrCard: {
    marginTop: 30, borderRadius: 34,
    shadowColor: '#2a1260', shadowOpacity: 0.4, shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 }, elevation: 14,
  },
  qrBorder: { padding: 4, borderRadius: 34 },
  qrInner: { backgroundColor: '#fff', borderRadius: 30, padding: 18 },
  errorBox: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', padding: 12 },
  errorText: { color: '#6b7280', fontSize: 13, textAlign: 'center', fontWeight: '600', marginTop: 8 },
  addressRow: {
    marginTop: 26, backgroundColor: colors.bgCard, borderRadius: 999, minHeight: 44,
    paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.14, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  address: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, width: '100%' },
  copyWrap: {
    flex: 1, borderRadius: 999,
    shadowColor: '#2a1260', shadowOpacity: 0.4, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 999, paddingVertical: 16,
  },
  copyLabel: { color: '#fff', fontWeight: '800', fontSize: 15, marginLeft: 8 },
  shareBtn: {
    width: 54, height: 54, borderRadius: 27, marginLeft: 12, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.22, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
});
