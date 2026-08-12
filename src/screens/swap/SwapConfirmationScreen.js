import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as swapService from '../../services/swapService';
import { useAuth } from '../../context/AuthContext';
import { formatNgn, formatCrypto } from '../../utils/formatters';

export default function SwapConfirmationScreen({ route, navigation }) {
  const { direction, symbol, amount, quote } = route.params ?? {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    try {
      if (direction === 'crypto_to_ngn') {
        await swapService.executeCryptoToNgn(user.uid, symbol, null, parseFloat(amount), quote);
      } else {
        await swapService.executeNgnToCrypto(user.uid, symbol, null, parseFloat(amount), quote);
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.title}>Swap complete</Text>
          <Text style={styles.subtitle}>Your balance has been updated.</Text>
          <View style={{ flex: 1 }} />
          <PrimaryButton title="Done" onPress={() => navigation.popToTop()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Confirm swap</Text>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>You send</Text>
            <Text style={styles.value}>{direction === 'crypto_to_ngn' ? `${amount} ${symbol}` : formatNgn(parseFloat(amount || '0'))}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>You receive</Text>
            <Text style={styles.value}>
              {direction === 'crypto_to_ngn' ? formatNgn(quote?.amountNgn - quote?.feeNgn) : formatCrypto(quote?.amountCrypto, symbol)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>{formatNgn(quote?.feeNgn ?? 0)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Confirm swap" onPress={onConfirm} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(6) },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2) },
  box: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing(4), borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2) },
  label: { color: colors.textSecondary, fontSize: 13 },
  value: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
