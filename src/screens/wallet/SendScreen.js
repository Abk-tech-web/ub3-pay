import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmationSheet from '../../components/ConfirmationSheet';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import { isPositiveAmount } from '../../utils/validators';
import { truncateAddress } from '../../utils/formatters';

export default function SendScreen({ route, navigation }) {
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const onReview = async () => {
    setError('');
    if (!(await walletService.validateAddress(chainId, address))) return setError('That address doesn\u2019t look right for this network.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount greater than 0.');
    setConfirmVisible(true);
  };

  const onConfirm = async () => {
    setSending(true);
    try {
      await walletService.sendCrypto(user.uid, chainId, symbol, address, amount);
      setConfirmVisible(false);
      navigation.goBack();
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
        <TextInput
          style={styles.input}
          placeholder={`${symbol} address`}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Review" onPress={onReview} />
      </View>

      <ConfirmationSheet
        visible={confirmVisible}
        title={`Send ${symbol}`}
        rows={[
          { label: 'To', value: truncateAddress(address) },
          { label: 'Amount', value: `${amount} ${symbol}` },
          { label: 'Network fee', value: 'Estimated at broadcast' },
        ]}
        onConfirm={onConfirm}
        onCancel={() => setConfirmVisible(false)}
        loading={sending}
      />
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
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(4),
    borderWidth: 1, borderColor: colors.border,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
