import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { NETWORKS, DATA_PLANS, buyData } from '../../services/billService';
import { formatNgn } from '../../utils/formatters';

export default function DataScreen({ navigation }) {
  const { user } = useAuth();
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const plans = DATA_PLANS[network] ?? [];

  const onBuy = async () => {
    setError('');
    if (phone.length < 10) return setError('Enter a valid phone number.');
    if (!planId) return setError('Choose a data plan.');
    setLoading(true);
    try {
      await buyData(user.uid, network, phone, planId);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.title}>Data delivered</Text>
          <Text style={styles.subtitle}>Plan activated for {phone}.</Text>
          <View style={{ flex: 1 }} />
          <PrimaryButton title="Done" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Buy data</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.pillRow}>
          {NETWORKS.map((n) => (
            <Pressable key={n.id} onPress={() => { setNetwork(n.id); setPlanId(null); }} style={[styles.pill, network === n.id && styles.pillActive]}>
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

        <Text style={styles.label}>Plan</Text>
        {plans.map((p) => (
          <Pressable key={p.id} onPress={() => setPlanId(p.id)} style={[styles.planRow, planId === p.id && styles.planRowActive]}>
            <Text style={styles.planLabel}>{p.label}</Text>
            <Text style={styles.planPrice}>{formatNgn(p.priceNgn)}</Text>
          </Pressable>
        ))}

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Buy data" onPress={onBuy} loading={loading} disabled={!planId} />
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
  planRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing(4), marginBottom: spacing(2), borderWidth: 1, borderColor: colors.border },
  planRowActive: { borderColor: colors.violet },
  planLabel: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  planPrice: { color: colors.violetSoft, fontWeight: '700', fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
