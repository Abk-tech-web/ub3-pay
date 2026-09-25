import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmationSheet from '../../components/ConfirmationSheet';
import FloatingInput from '../../components/FloatingInput';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as walletService from '../../services/walletService';
import { getUsdPrice } from '../../services/rateService';
import { getMarginUsd } from '../../services/feeService';
import { isPositiveAmount } from '../../utils/validators';
import { truncateAddress, formatUsd } from '../../utils/formatters';

export default function SendScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const { user } = useAuth();
  const { adjustCryptoBalance, addActivity, portfolio, refreshPortfolio } = useWallet();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [fee, setFee] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.selectedAddress) {
        setAddress(route.params.selectedAddress);
        setError('');
        navigation.setParams({ selectedAddress: undefined });
      } else {
        setAddress('');
        setAmount('');
        setError('');
        setFee(null);
      }
    }, [route.params?.selectedAddress])
  );
  const [usdRate, setUsdRate] = useState(null);

  useEffect(() => {
    let active = true;
    getUsdPrice(symbol)
      .then((rate) => { if (active) setUsdRate(rate); })
      .catch(() => { if (active) setUsdRate(null); });
    return () => { active = false; };
  }, [symbol]);

  const amountUsd = usdRate && amount ? Number(amount) * usdRate : null;
  const FEE_RESERVE = { SOL: 0.00095, BTC: 0.00005, ETH: 0.0005, BNB: 0.001, MATIC: 0.01, AVAX: 0.005, TRX: 1, TON: 0.05, ADA: 1, LTC: 0.0001, XRP: 1, SUI: 0.01 };
  const heldAsset = ((portfolio && portfolio.assets) || []).find((a) => a.symbol === symbol && a.chainId === chainId);
  const available = heldAsset ? parseFloat(heldAsset.balance) || 0 : null;
  const trim = (n, d) => n.toFixed(d).replace(/\.?0+$/, '');
  const availText = available === null ? null : trim(available, 6);
  const serviceFee = usdRate ? getMarginUsd() / usdRate : 0;
  const needed = Number(amount) + serviceFee + (FEE_RESERVE[symbol] || 0);
  const insufficient = available !== null && amount !== '' && needed > available + 1e-9;
  const insufficientMsg = 'Insufficient balance. You have ' + availText + ' ' + symbol + ', but the amount plus the service fee needs about ' + trim(needed, 6) + ' ' + symbol + '.';
  const onMax = () => {
    if (available === null) return;
    const max = Math.max(0, available - serviceFee - (FEE_RESERVE[symbol] || 0));
    setAmount(trim(max, 8));
  };

  const onReview = async () => {
    setError('');
    if (!address.trim()) return setError('Enter the recipient address.');
    if (!(await walletService.validateAddress(chainId, address))) return setError('That address doesn\u2019t look right for this network.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount greater than 0.');
    if (insufficient) return setError(insufficientMsg);
    try {
      const f = await walletService.estimateNetworkFee(chainId);
      setFee(f);
      setConfirmVisible(true);
    } catch (e) {
      setError((e && e.message) ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const onConfirm = async () => {
    setSending(true);
    try {
      const result = await walletService.sendCrypto(user.uid, chainId, symbol, address, amount);
      adjustCryptoBalance(symbol, -Number(amount));
      if (refreshPortfolio) refreshPortfolio();
      setConfirmVisible(false);
      navigation.navigate('TransactionReceipt', {
        amountPrefix: '-',
        amount: `${amount} ${symbol}`,
        topRightLabel: 'Sent',
        rows: [
          { label: 'To', value: truncateAddress(address) },
          { label: 'Network', value: chainId },
          { label: 'Amount', value: `${amount} ${symbol}` },
          { label: 'Network fee', value: fee ? formatUsd(fee.networkFeeUsd) : '...' },
        ],
        date: new Date().toISOString(),
      });
    } catch (e) {
      setConfirmVisible(false);
      setError(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Send {symbol}</Text>

        {insufficient ? <Text style={styles.error}>{insufficientMsg}</Text> : error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Recipient address</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SelectRecipient', { targetRoute: 'SendAmount', chainId, symbol })}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Select saved</Text>
          </TouchableOpacity>
        </View>
        <FloatingInput
          label={`${symbol} Address`}
          value={address}
          onChangeText={(t) => { setAddress(t); setError(''); }}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Amount</Text>
        <FloatingInput
          label="Amount"
          value={amount}
          onChangeText={(t) => { setAmount(t); setError(''); }}
          keyboardType="decimal-pad"
        />
        {amountUsd !== null ? (
          <Text style={styles.usdLine}>{formatUsd(amountUsd)}</Text>
        ) : null}

        {availText !== null ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>Available: {availText} {symbol}</Text>
            <Text onPress={onMax} style={{ color: '#7c3aed', fontSize: 13, fontWeight: '700' }}>Max</Text>
          </View>
        ) : null}

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Review" onPress={onReview} />
      </View>

      <ConfirmationSheet
        visible={confirmVisible}
        title={`Send ${symbol}`}
        icon="paper-plane"
        rows={[
          { label: 'To', value: truncateAddress(address) },
          { label: 'Amount', value: `${amount} ${symbol}` },
          { label: 'Network fee', value: fee ? formatUsd(fee.networkFeeUsd) : '...' },
          { label: 'Service fee', value: fee ? formatUsd(fee.revenueFeeUsd) : '...' },
            { label: 'Total from your balance', value: usdRate ? trim(Number(amount) + serviceFee, 8) + ' ' + symbol : '...' },
          { label: 'Total fee', value: fee ? formatUsd(fee.totalFeeUsd) : '...' },
        ]}
        onConfirm={onConfirm}
        onCancel={() => setConfirmVisible(false)}
        loading={sending}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(6) },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(2),
    borderWidth: 1, borderColor: colors.border,
  },
  usdLine: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(4) },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
