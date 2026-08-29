import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { isValidPin } from '../../utils/validators';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { NETWORKS, buyAirtime, buyData } from '../../services/billService';

function genSessionId() {
  return Date.now() + '' + Math.floor(Math.random() * 1000000);
}

export default function BillConfirmPinScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { kind, network, phone, amount, planLabel, planId } = route.params;
  const { user } = useAuth();
  const { adjustNgnBalance, addActivity } = useWallet();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [bvnBlocked, setBvnBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const networkObj = NETWORKS.find((n) => n.id === network);
  const formattedAmount = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const onConfirm = async () => {
    setError('');
    if (!isValidPin(pin)) return setError('PIN must be 4 digits.');
    // TODO (integration): verify PIN against stored hash via expo-secure-store,
    // then call real VTU delivery API. Currently proceeds to receipt screen.
    setLoading(true);
    try {
      if (kind === 'data') {
        await buyData(user.uid, network, phone, planId);
      } else {
        await buyAirtime(user.uid, network, phone, amount);
      }
      const sessionId = genSessionId();
      adjustNgnBalance(-amount);
      addActivity({
        id: 'act_' + Date.now(),
        label: (networkObj?.name || '') + (kind === 'data' ? ' Data' : ' Airtime'),
        at: new Date().toISOString(),
        status: 'success',
        amount,
        symbol: 'NGN',
        direction: 'out',
        network: networkObj?.name,
        phone,
        planLabel,
        reference: sessionId,
      });
      navigation.replace('TransactionReceipt', {
        dismissTo: kind === 'data' ? 'Data' : 'Airtime',
        amountPrefix: '- NGN ',
        amount: formattedAmount,
        topRightLabel: kind === 'data' ? 'Data' : 'Airtime',
        topRightIcon: 'phone-portrait-outline',
        rows: [
          { label: 'Type', value: kind === 'data' ? 'Mobile Data' : 'Airtime' },
          { label: 'Network', value: networkObj?.name },
          { label: 'Recipient', value: phone },
          ...(planLabel ? [{ label: 'Plan', value: planLabel }] : []),
          { label: 'Amount', value: 'NGN ' + formattedAmount },
          { label: 'Session ID', value: sessionId },
        ],
        date: new Date().toISOString(),
      });
    } catch (err) {
      if (err.status === 403 && err.code === 'bvn_verification_required') {
        setError('Please verify your BVN before making purchases.');
        setBvnBlocked(true);
      } else {
        setError(err.message || 'Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Confirm PIN</Text>
        <Text style={styles.subtitle}>Enter your PIN to complete this purchase</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryValue}>NGN {formattedAmount}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      {bvnBlocked ? (
        <Pressable onPress={() => navigation.navigate('VerifyBvn')}>
          <Text style={styles.verifyLink}>Verify Now</Text>
        </Pressable>
      ) : null}

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
          loading={loading}
          disabled={pin.length !== 4}
        />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  verifyLink: { color: colors.violet, fontWeight: '600', marginTop: spacing(2) },
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(6) },
  summaryCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing(4), marginBottom: spacing(5) },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing(1) },
  summaryValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, borderWidth: 1, borderColor: colors.border,
    letterSpacing: 8, textAlign: 'center', fontSize: 18,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
