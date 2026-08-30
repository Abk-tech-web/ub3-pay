import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useWallet } from '../../context/WalletContext';

export default function WithdrawAmountScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { bank, accountNumber, accountName } = route.params;
  const { portfolio } = useWallet();
  const ngnBalance = portfolio.ngnBalance;
  const [amount, setAmount] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const canContinue = numericAmount > 0 && numericAmount <= (ngnBalance ?? 0);

  const onMax = () => {
    setAmount(String(ngnBalance ?? 0));
  };

  const onContinue = () => {
    navigation.navigate('ConfirmPin', {
      bank,
      accountNumber,
      accountName,
      amount: numericAmount,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Amount</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Withdrawing to</Text>
          <Text style={styles.summaryValue}>{bank.name} • {accountNumber}</Text>
          {accountName ? (
            <Text style={styles.summaryName}>{accountName}</Text>
          ) : null}
        </View>

        <Text style={styles.label}>Amount (NGN)</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable style={styles.maxButton} onPress={onMax}>
            <Text style={styles.maxButtonText}>MAX</Text>
          </Pressable>
        </View>
        <Text style={styles.balanceHint}>
          Available: {(ngnBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </Text>

        <View style={{ flex: 1 }} />

        <PrimaryButton
          title="Continue"
          onPress={onContinue}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(2) },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    marginBottom: spacing(6),
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing(1) },
  summaryValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  summaryName: { fontSize: 13, color: '#008751', marginTop: spacing(1), fontWeight: '600' },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing(2) },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  amountInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 20,
    fontWeight: '700',
  },
  maxButton: {
    backgroundColor: '#e6f4ea',
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxButtonText: { color: '#008751', fontWeight: '700', fontSize: 13 },
  balanceHint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing(2) },
});
