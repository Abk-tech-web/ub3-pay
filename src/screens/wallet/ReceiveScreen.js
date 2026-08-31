import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import { truncateAddress } from '../../utils/formatters';
import SkeletonLoader from '../../components/SkeletonLoader';
import TokenIcon from '../../components/TokenIcon';

export default function ReceiveScreen({ route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const { user } = useAuth();
  const [address, setAddress] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const UNSUPPORTED_CHAINS = ['bitcoin', 'litecoin', 'tron', 'xrp', 'ton', 'sui'];

  useEffect(() => {
    if (!user) return;
    if (UNSUPPORTED_CHAINS.includes(chainId)) {
      setError('not_supported');
      return;
    }
    setError(null);
    setAddress(null);
    const timeout = setTimeout(() => setError('timeout'), 25000);
    walletService.getDepositAddress(user.uid, chainId)
      .then((r) => { clearTimeout(timeout); setAddress(r.address); })
      .catch(() => { clearTimeout(timeout); setError('failed'); });
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
          <TokenIcon symbol={symbol} chainId={chainId} size={40} />
          <View style={{ marginLeft: spacing(3) }}>
            <Text style={styles.title}>Receive {symbol}</Text>
            <Text style={styles.chainTag}>on this network</Text>
          </View>
        </View>

        <View style={styles.warning}>
          <Feather name="alert-triangle" size={14} color="#facc15" />
          <Text style={styles.warningText}>Only send {symbol} on this network to this address</Text>
        </View>

        <View style={styles.qrCard}>
          <LinearGradient
            colors={[colors.violet, colors.violetDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrBorder}
          >
            <View style={styles.qrInner}>
                  {error ? (
                    <View style={styles.errorBox}>
                      <Feather name='alert-circle' size={32} color='#f87171' />
                      <Text style={styles.errorText}>{error === 'not_supported' ? symbol + ' deposits are not supported yet' : 'Could not load address. Pull to retry.'}</Text>
                    </View>
                  ) : address ? (
                    <QRCode value={address} size={190} backgroundColor='#fff' color='#000' />
                  ) : (
                    <SkeletonLoader width={190} height={190} />
                  )}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.addressRow}>
          <Text style={styles.address}>{address ? truncateAddress(address, 12, 10) : ''}</Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.copyBtn} onPress={copy}>
            <Feather name={copied ? 'check' : 'copy'} size={16} color="#fff" />
            <Text style={styles.copyLabel}>{copied ? 'Copied!' : 'Copy address'}</Text>
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={share}>
            <Feather name="share-2" size={16} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, opacity: 0.5 },
  body: { flex: 1, padding: spacing(6), alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: spacing(4) },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  chainTag: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  warning: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(2),
    backgroundColor: '#2e2a0f', borderRadius: radii.md, paddingVertical: spacing(2), paddingHorizontal: spacing(3),
    marginTop: spacing(5), width: '100%',
  },
  warningText: { color: '#facc15', fontSize: 12, fontWeight: '600', flex: 1 },
  qrCard: { marginTop: spacing(8) },
  qrBorder: { padding: 3, borderRadius: radii.lg + 4 },
  qrInner: { backgroundColor: '#fff', borderRadius: radii.lg, padding: spacing(4) },
  errorBox: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center', gap: spacing(2), padding: spacing(3) },
  errorText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  addressRow: {
    marginTop: spacing(6), backgroundColor: colors.bgElevated, borderRadius: radii.pill,
    paddingVertical: spacing(2), paddingHorizontal: spacing(4), borderWidth: 1, borderColor: colors.border,
  },
  address: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(6), width: '100%' },
  copyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2),
    backgroundColor: colors.violet, borderRadius: radii.pill, paddingVertical: spacing(4),
  },
  copyLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
});
