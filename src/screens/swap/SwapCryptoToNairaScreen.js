import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as swapService from '../../services/swapService';
import { formatNgn, formatCrypto } from '../../utils/formatters';
import { isPositiveAmount } from '../../utils/validators';

export default function SwapCryptoToNairaScreen({ route, navigation }) {
  const { symbol = 'USDT' } = route.params ?? {};
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    if (!isPositiveAmount(amount)) return setQuote(null);
    setQuoting(true);
    const t = setTimeout(() => {
      swapService.quoteCryptoToNgn(symbol, parseFloat(amount)).then(setQuote).finally(() => setQuoting(false));
    }, 350);
    return () => clearTimeout(t);
  }, [amount, symbol]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Swap {symbol} → Naira</Text>

        <Text style={styles.label}>Amount ({symbol})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {quote && (
          <View style={styles.quoteBox}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>You'll receive</Text>
              <Text style={styles.quoteValue}>{formatNgn(quote.amountNgn - quote.feeNgn)}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate</Text>
              <Text style={styles.quoteValue}>1 {symbol} ≈ {formatNgn(quote.rate)}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Fee</Text>
              <Text style={styles.quoteValue}>{formatNgn(quote.feeNgn)}</Text>
            </View>
          </View>
        )}

        <View style={{ flex: 1 }} />
        <PrimaryButton
          title="Continue"
          loading={quoting}
          disabled={!quote}
          onPress={() => navigation.navigate('SwapConfirmation', { direction: 'crypto_to_ngn', symbol, amount, quote })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(6) },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, borderWidth: 1, borderColor: colors.border,
  },
  quoteBox: { marginTop: spacing(6), backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing(4), borderWidth: 1, borderColor: colors.border },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(1.5) },
  quoteLabel: { color: colors.textSecondary, fontSize: 13 },
  quoteValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
