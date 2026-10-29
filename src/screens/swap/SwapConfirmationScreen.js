import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Vibration, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import PinGate from '../../components/PinGate';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import * as swapService from '../../services/swapService';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { formatNgn, formatCrypto } from '../../utils/formatters';

const PIN_CODES = ['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'];

function c2cMessage(c) {
  if (c === 'swap_failed_refunded') return 'The swap could not be completed and your coins were returned to your wallet.';
  if (c === 'swap_pending_support') return 'Your swap is being checked by our team. Please contact customer service and we will sort it out.';
  if (c === 'quote_expired') return 'This quote has expired. Go back and get a new quote.';
  if (c === 'quote_used') return 'This quote was already used. Go back and get a new quote.';
  if (c === 'insufficient_balance') return 'Not enough balance. Keep a little extra for network fees.';
  if (c === 'no_liquidity') return 'Not enough liquidity right now. Please try a smaller amount or try again later.';
  if (c === 'insufficient_gas') return 'You need a little SOL (Solana) or ETH (Base) in your wallet to pay the network fee for this swap.';
  if (c === 'swap_in_progress') return 'A swap is already in progress. Please wait a moment.';
  return 'The swap could not be completed. Please try again.';
}

export default function SwapConfirmationScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { direction, symbol, amount, quote } = route.params ?? {};
  const isC2c = direction === 'crypto_to_crypto';
  const { user } = useAuth();
  const { adjustNgnBalance, adjustCryptoBalance, addActivity, refreshPortfolio } = useWallet();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinErrCode, setPinErrCode] = useState('');
  const [phase, setPhase] = useState('idle');
  const calc = () => (isC2c && quote ? Math.max(0, Math.ceil((quote.expiresAt - Date.now()) / 1000)) : 0);
  const [secs, setSecs] = useState(calc());

  useEffect(() => {
    if (!isC2c || !quote) return undefined;
    const t = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(t);
  }, []);

  const expired = isC2c && secs <= 0;

  const onPin = async (pin) => {
    setPinErrCode('');
    setPinBusy(true);
    setPhase('processing');
    try {
      await swapService.executeCryptoToCrypto(quote.quoteId, pin);
      setPinBusy(false);
      setGateOpen(false);
      if (refreshPortfolio && user) refreshPortfolio(user.uid);
      setPhase('success');
      Vibration.vibrate([0, 70, 90, 70]);
      await new Promise((resolve) => setTimeout(resolve, 1300));
      setTimeout(() => setPhase('idle'), 700);
      navigation.replace('TransactionReceipt', {
        amountPrefix: '+ ',
        amount: formatCrypto(quote.toAmount, quote.toSymbol) + ' ' + quote.toSymbol,
        topRightLabel: 'Swap',
        topRightIcon: 'swap-horizontal-outline',
        rows: [
          { label: 'Type', value: 'Crypto Swap' },
          { label: 'Sold', value: formatCrypto(quote.fromAmount, quote.fromSymbol) + ' ' + quote.fromSymbol },
          { label: 'Received', value: formatCrypto(quote.toAmount, quote.toSymbol) + ' ' + quote.toSymbol },
          { label: 'Fee', value: quote.feePct + '% (included)' },
        ],
        date: new Date().toISOString(),
        status: 'success',
      });
    } catch (e) {
      setPhase('idle');
      setPinBusy(false);
      const c = (e && (e.code || e.message)) || '';
      if (PIN_CODES.indexOf(c) >= 0) { setPinErrCode(c); return; }
      setGateOpen(false);
      Alert.alert('Swap failed', c2cMessage(c));
    }
  };

  const onConfirm = async () => {
    if (isC2c) {
      if (expired) return;
      setPinErrCode('');
      setGateOpen(true);
      return;
    }
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
      Alert.alert('Swap failed', msg);
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
                amount: isNgnOut ? formatNgn(quote?.amountNgn) : formatCrypto(quote?.amountCrypto, symbol),
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

  const sendText = isC2c
    ? quote.fromAmount + ' ' + quote.fromSymbol
    : direction === 'crypto_to_ngn' ? amount + ' ' + symbol : formatNgn(parseFloat(amount || '0'));
  const receiveText = isC2c
    ? formatCrypto(quote.toAmount, quote.toSymbol) + ' ' + quote.toSymbol
    : direction === 'crypto_to_ngn' ? formatNgn(quote?.amountNgn) : formatCrypto(quote?.amountCrypto, symbol);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Confirm swap</Text>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>You send</Text>
          <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{sendText}</Text>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <LinearGradient colors={['#9B6CF7', colors.violet, colors.violetDeep]} style={styles.badge}>
              <Feather name="arrow-down" size={20} color="#fff" />
            </LinearGradient>
            <View style={styles.line} />
          </View>
          <Text style={styles.heroLabel}>You receive</Text>
          <Text style={styles.heroReceive} numberOfLines={1} adjustsFontSizeToFit>{receiveText}</Text>
        </View>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>
              {isC2c
                ? '1 ' + quote.fromSymbol + ' \u2248 ' + formatCrypto(quote.rate, quote.toSymbol) + ' ' + quote.toSymbol
                : 'Live P2P rate, 1% fee included'}
            </Text>
          </View>
          <View style={[styles.row, isC2c ? null : { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Fee ({isC2c ? quote.feePct : 1}%)</Text>
            <Text style={styles.value}>
              {isC2c
                ? 'about $' + (quote.usdValue * quote.feePct / 100).toFixed(2)
                : formatNgn(direction === 'crypto_to_ngn' ? (quote?.amountNgn || 0) / 99 : parseFloat(amount || '0') * 0.01)}
            </Text>
          </View>
          {isC2c ? (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Quote valid for</Text>
              <Text style={[styles.value, expired && { color: colors.danger }]}>{expired ? 'Expired' : secs + ' seconds'}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1 }} />
        {isC2c && expired ? (
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.expiredBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.expiredText}>Quote expired. Get a new quote</Text>
          </Pressable>
        ) : (
          <PrimaryButton title="Confirm swap" onPress={onConfirm} loading={loading} />
        )}
      </View>

      <PinGate
        visible={gateOpen}
        busy={pinBusy}
        errorCode={pinErrCode}
        onSubmit={onPin}
        onCancel={() => setGateOpen(false)}
      />
      <ProcessingOverlay visible={phase !== 'idle'} phase={phase} title={phase === 'success' ? 'Swap complete' : 'Swapping'} />
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
  expiredBtn: { height: 54, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 90 },
  expiredText: { color: colors.danger, fontSize: 15, fontWeight: '800' },
});
