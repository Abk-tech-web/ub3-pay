import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as swapService from '../../services/swapService';
import { formatNgn, formatCrypto } from '../../utils/formatters';
import { isPositiveAmount } from '../../utils/validators';

const COMMON_ASSETS = ['USDT', 'BTC', 'ETH', 'SOL'];

export default function SwapNairaToCryptoScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [symbol, setSymbol] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    if (!isPositiveAmount(amount)) return setQuote(null);
    setQuoting(true);
    const t = setTimeout(() => {
      swapService.quoteNgnToCrypto(symbol, parseFloat(amount)).then(setQuote).finally(() => setQuoting(false));
    }, 350);
    return () => clearTimeout(t);
  }, [amount, symbol]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Swap Naira → Crypto</Text>

        <View style={styles.pillRow}>
          {COMMON_ASSETS.map((s) => (
            <Pressable key={s} onPress={() => setSymbol(s)} style={[styles.pill, symbol === s && styles.pillActive]}>
              <Text style={[styles.pillLabel, symbol === s && styles.pillLabelActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Amount (NGN)</Text>
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
              <Text style={styles.quoteValue}>{formatCrypto(quote.amountCrypto, symbol)}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate</Text>
              <Text style={styles.quoteValue}>1 {symbol} ≈ {formatNgn(quote.rate)}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate includes margin</Text>
              <Text style={styles.quoteValue}>₦20/$ (live rate applied)</Text>
            </View>
          </View>
        )}

        <View style={{ flex: 1 }} />
        <PrimaryButton
          title="Continue"
          loading={quoting}
          disabled={!quote}
          onPress={() => navigation.navigate('SwapConfirmation', { direction: 'ngn_to_crypto', symbol, amount, quote })}
        />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: spacing(6) },
  pillRow: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(6) },
  pill: { paddingVertical: spacing(2.5), paddingHorizontal: spacing(4.5), borderRadius: 999, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  pillActive: { backgroundColor: colors.violet, borderColor: colors.violet, shadowColor: colors.violetDeep, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 9 },
  pillLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  pillLabelActive: { color: '#fff' },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing(2) },
  input: { backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: 22, paddingHorizontal: spacing(5), height: 64, fontSize: 24, fontWeight: '800', borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  quoteBox: { marginTop: spacing(6), backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing(5), borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.24, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 11 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(2) },
  quoteLabel: { color: colors.textSecondary, fontSize: 13 },
  quoteValue: { color: colors.violet, fontSize: 14, fontWeight: '800' },
});
