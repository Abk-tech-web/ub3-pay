import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { isValidPin } from '../../utils/validators';
import { useWallet } from '../../context/WalletContext';

function genSessionId() {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
}

export default function ConfirmPinScreen({ navigation, route }) {
  const { bank, accountNumber, accountName, amount } = route.params;
  const { adjustNgnBalance, addActivity } = useWallet();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const onConfirm = () => {
    setError('');
    if (!isValidPin(pin)) return setError('PIN must be 4 digits.');
    // TODO (integration): verify PIN against stored hash via expo-secure-store,
    // then call real payout API. Currently just proceeds to receipt screen.
    const sessionId = genSessionId();
    adjustNgnBalance(-amount);
    addActivity({
      id: 'act_' + Date.now(),
      label: `Withdraw to ${bank.name}`,
      at: new Date().toISOString(),
      status: 'success',
      amount,
      symbol: 'NGN',
      direction: 'out',
      bankName: bank.name,
      accountNumber,
      accountName,
      reference: sessionId,
    });
    navigation.replace('TransactionReceipt', {
      amountPrefix: '- NGN ',
      amount: Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
      topRightLabel: 'Bank',
      topRightIcon: 'business-outline',
      rows: [
        { label: 'Type', value: 'Bank Withdrawal' },
        { label: 'Sent to', value: accountName },
        { label: 'Receiver\u2019s Account', value: `${bank.name} (${accountNumber})` },
        { label: 'Amount', value: `NGN ${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
        { label: 'Session ID', value: sessionId },
      ],
      date: new Date().toISOString(),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Confirm PIN</Text>
        <Text style={styles.subtitle}>
          Enter your PIN to withdraw to {bank.name} - {accountNumber}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Account Name</Text>
          <Text style={styles.summaryValue}>{accountName}</Text>
          <Text style={[styles.summaryLabel, { marginTop: 12 }]}>Amount</Text>
          <Text style={styles.summaryValue}>NGN {Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Enter PIN"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={pin}
          onChangeText={setPin}
        />

        <View style={{ flex: 1 }} />

        <PrimaryButton
          title="Confirm"
          onPress={onConfirm}
          disabled={pin.length !== 4}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing(2),
    marginBottom: spacing(6),
  },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    marginBottom: spacing(5),
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing(1) },
  summaryValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  input: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 18,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
