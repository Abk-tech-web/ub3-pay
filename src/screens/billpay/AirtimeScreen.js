import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { NETWORKS, buyAirtime } from '../../services/billService';
import { isPositiveAmount } from '../../utils/validators';
import { formatNgn } from '../../utils/formatters';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

export default function AirtimeScreen({ navigation }) {
  const { user } = useAuth();
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onBuy = async () => {
    setError('');
    if (phone.length < 10) return setError('Enter a valid phone number.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount.');
    setLoading(true);
    try {
      await buyAirtime(user.uid, network, phone, parseFloat(amount));
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.title}>Airtime delivered</Text>
          <Text style={styles.subtitle}>{formatNgn(parseFloat(amount))} sent to {phone}.</Text>
          <View style={{ flex: 1 }} />
          <PrimaryButton title="Done" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Buy airtime</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.pillRow}>
          {NETWORKS.map((n) => (
            <Pressable key={n.id} onPress={() => setNetwork(n.id)} style={[styles.pill, network === n.id && styles.pillActive]}>
              <Text style={[styles.pillLabel, network === n.id && styles.pillLabelActive]}>{n.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          placeholder="080..."
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Amount</Text>
        <View style={styles.pillRow}>
          {QUICK_AMOUNTS.map((a) => (
            <Pressable key={a} onPress={() => setAmount(String(a))} style={[styles.pill, amount === String(a) && styles.pillActive]}>
              <Text style={[styles.pillLabel, amount === String(a) && styles.pillLabelActive]}>₦{a}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Or enter custom amount"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Buy airtime" onPress={onBuy} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(5) },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2) },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(4) },
  pill: { paddingVertical: spacing(2), paddingHorizontal: spacing(4), borderRadius: radii.pill, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  pillLabel: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  pillLabelActive: { color: colors.bg },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(4), borderWidth: 1, borderColor: colors.border,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
