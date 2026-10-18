import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as swapService from '../../services/swapService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { formatNgn, formatCrypto } from '../../utils/formatters';

export default function SwapConfirmationScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { direction, symbol, amount, quote } = route.params ?? {};
  const { user } = useAuth();
  const { adjustNgnBalance, adjustCryptoBalance, addActivity } = useWallet();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    try {
      if (direction === 'crypto_to_ngn') {
        await swapService.executeCryptoToNgn(user.uid, symbol, null, parseFloat(amount), quote);
          adjustNgnBalance(quote.amountNgn);
          adjustCryptoBalance(symbol, -parseFloat(amount));
          addActivity({ id: 'act_' + Date.now(), label: 'swap crypto to ngn', at: new Date().toISOString(), status: 'success', amount: parseFloat(amount), symbol, direction: 'out', kind: 'swap', fromSymbol: symbol, fromAmount: parseFloat(amount), toSymbol: 'NGN', toAmount: quote.amountNgn });
      } else {
        await swapService.executeNgnToCrypto(user.uid, symbol, null, parseFloat(amount), quote);
          adjustNgnBalance(-parseFloat(amount));
          adjustCryptoBalance(symbol, quote.amountCrypto);
          addActivity({ id: 'act_' + Date.now(), label: 'swap ngn to crypto', at: new Date().toISOString(), status: 'success', amount: quote.amountCrypto, symbol, direction: 'in', kind: 'swap', fromSymbol: 'NGN', fromAmount: parseFloat(amount), toSymbol: symbol, toAmount: quote.amountCrypto });
      }
      setDone(true);
    } catch (e) {
      const msg = e && e.code === 'bvn_verification_required' ? 'Please verify your BVN to continue.' : ((e && e.message) || 'Something went wrong');
      require('react-native').Alert.alert('Swap failed', msg);
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
          <PrimaryButton
          title="View Receipt"
          onPress={() => {
            const isNgnOut = direction === 'crypto_to_ngn';
            navigation.replace('TransactionReceipt', {
              amountPrefix: isNgnOut ? '+ NGN ' : '+ ',
              amount: isNgnOut
                ? formatNgn(quote?.amountNgn)
                : formatCrypto(quote?.amountCrypto, symbol),
              topRightLabel: 'Swap',
              topRightIcon: 'swap-horizontal-outline',
              rows: [
                { label: 'Type', value: 'Crypto Swap' },
                { label: 'Sold', value: isNgnOut ? formatCrypto(amount, symbol) + ' ' + symbol : formatNgn(amount) + ' NGN' },
                { label: 'Received', value: isNgnOut ? formatNgn(quote?.amountNgn) + ' NGN' : formatCrypto(quote?.amountCrypto, symbol) + ' ' + symbol },
              ],
            });
          }}
        />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Confirm swap</Text>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>You send</Text>
          <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
            {direction === 'crypto_to_ngn' ? amount + ' ' + symbol : formatNgn(parseFloat(amount || '0'))}
          </Text>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <LinearGradient colors={['#9B6CF7', colors.violet, colors.violetDeep]} style={styles.badge}>
              <Feather name="arrow-down" size={20} color="#fff" />
            </LinearGradient>
            <View style={styles.line} />
          </View>
          <Text style={styles.heroLabel}>You receive</Text>
          <Text style={styles.heroReceive} numberOfLines={1} adjustsFontSizeToFit>
            {direction === 'crypto_to_ngn' ? formatNgn(quote?.amountNgn) : formatCrypto(quote?.amountCrypto, symbol)}
          </Text>
        </View>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>Live P2P rate, 1% fee included</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Fee (1%)</Text>
            <Text style={styles.value}>{formatNgn(direction === 'crypto_to_ngn' ? (quote?.amountNgn || 0) / 99 : parseFloat(amount || '0') * 0.01)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Confirm swap" onPress={onConfirm} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: spacing(6) },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2) },
  hero: { backgroundColor: colors.bgCard, borderRadius: 32, paddingVertical: spacing(8), paddingHorizontal: spacing(6), borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 16 }, elevation: 14 },
  heroLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroAmount: { color: colors.textPrimary, fontSize: 34, fontWeight: '900', marginTop: spacing(2) },
  heroReceive: { color: colors.violet, fontSize: 38, fontWeight: '900', marginTop: spacing(2) },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing(6) },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing(3), shadowColor: colors.violetDeep, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
  box: { marginTop: spacing(5), backgroundColor: colors.bgCard, borderRadius: 26, paddingHorizontal: spacing(5), paddingVertical: spacing(2), borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 11 }, elevation: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(4), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', maxWidth: '62%', textAlign: 'right' },
});
