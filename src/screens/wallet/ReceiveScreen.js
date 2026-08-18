import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import { truncateAddress } from '../../utils/formatters';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function ReceiveScreen({ route }) {
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const { user } = useAuth();
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (user) walletService.getDepositAddress(user.uid, chainId).then((r) => setAddress(r.address));
  }, [user, chainId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Receive {symbol}</Text>
        <Text style={styles.subtitle}>Only send {symbol} on this network to this address.</Text>

        <View style={styles.qrWrap}>
          {address ? <QRCode value={address} size={200} backgroundColor={colors.bgCard} color={colors.textPrimary} /> : <SkeletonLoader width={200} height={200} />}
        </View>

        <Text style={styles.address}>{address ? truncateAddress(address, 10, 8) : ''}</Text>

        <Pressable style={styles.copyBtn} onPress={() => address && Share.share({ message: address })}>
          <Text style={styles.copyLabel}>Share address</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(2), marginBottom: spacing(8), textAlign: 'center' },
  qrWrap: { padding: spacing(5), backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  address: { color: colors.textPrimary, fontFamily: undefined, fontSize: 14, marginTop: spacing(6) },
  copyBtn: { marginTop: spacing(6), paddingVertical: spacing(3), paddingHorizontal: spacing(8), borderRadius: radii.pill, backgroundColor: colors.violet },
  copyLabel: { color: colors.bg, fontWeight: '700' },
});
