import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmationSheet from '../../components/ConfirmationSheet';
import FloatingInput from '../../components/FloatingInput';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as walletService from '../../services/walletService';
import { getUsdPrice } from '../../services/rateService';
import { isPositiveAmount } from '../../utils/validators';
import { truncateAddress, formatUsd } from '../../utils/formatters';

export default function SendScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const { user } = useAuth();
  const { adjustCryptoBalance, addActivity } = useWallet();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [fee, setFee] = useState(null);
  const [usdRate, setUsdRate] = useState(null);

  useEffect(() => {
    let active = true;
    getUsdPrice(symbol)
      .then((rate) => { if (active) setUsdRate(rate); })
      .catch(() => { if (active) setUsdRate(null); });
    return () => { active = false; };
  }, [symbol]);

  const amountUsd = usdRate && amount ? Number(amount) * usdRate : null;

  const onReview = async () => {
    setError('');
    if (!(await walletService.validateAddress(chainId, address))) return setError('That address doesn\u2019t look right for this network.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount greater than 0.');
    const f = await walletService.estimateNetworkFee(chainId);
    setFee(f);
    setConfirmVisible(true);
  };

  const onConfirm = async () => {
    setSending(true);
    try {
      const result = await walletService.sendCrypto(user.uid, chainId, symbol, address, amount);
      adjustCryptoBalance(symbol, -Number(amount));
      addActivity({
        id: result?.id ?? String(Date.now()),
        label: `Sent ${symbol}`,
        at: new Date().toISOString(),
        status: result?.status ?? 'processing',
        amount: Number(amount),
        symbol,
        direction: 'send',
        chainId,
        toAddress: address,
        txHash: result?.txHash ?? null,
      });
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
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Send {symbol}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Recipient address</Text>
        <FloatingInput
          label={`${symbol} Address`}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Amount</Text>
        <FloatingInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        {amountUsd !== null ? (
          <Text style={styles.usdLine}>{formatUsd(amountUsd)}</Text>
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
