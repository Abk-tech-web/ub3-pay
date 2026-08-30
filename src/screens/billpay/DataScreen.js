import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { NETWORKS, getDataVariations } from '../../services/billService';
import { formatNgn } from '../../utils/formatters';
import NetworkIcon from '../../components/NetworkIcon';
import NetworkSelectorModal from '../../components/NetworkSelectorModal';

export default function DataScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const selectedNetwork = NETWORKS.find((n) => n.id === network);
  const selectedPlan = plans.find((p) => p.id === planId);

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    setPlansError('');
    setPlans([]);
    setPlanId(null);
    getDataVariations(network)
      .then((result) => {
        if (!cancelled) setPlans(result);
      })
      .catch((err) => {
        if (!cancelled) setPlansError(err.message || 'Could not load data plans.');
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });
    return () => { cancelled = true; };
  }, [network]);

  const onBuy = () => {
    setError('');
    if (phone.length < 10) return setError('Enter a valid phone number.');
    if (!planId) return setError('Choose a data plan.');
    navigation.navigate('ConfirmPurchase', {
      kind: 'data',
      network,
      phone,
      amount: selectedPlan?.priceNgn,
      planId,
      planLabel: selectedPlan?.label,
    });
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.title}>Data delivered</Text>
          <Text style={styles.subtitle}>{selectedPlan?.label} sent to {phone}.</Text>
          <View style={{ flex: 1 }} />
          <PrimaryButton title="Done" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mobile Data</Text>
        <Pressable onPress={() => navigation.navigate('ActivityTab', { screen: 'ActivityList' })} hitSlop={12}>
          <Text style={styles.headerLink}>History</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.selectorCard}>
          <Pressable style={styles.selectorLeft} onPress={() => setModalVisible(true)}>
            <NetworkIcon network={selectedNetwork} size={32} />
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginHorizontal: spacing(1) }} />
          </Pressable>
          <View style={styles.divider} />
          <TextInput
            style={styles.phoneInput}
            placeholder="e.g 906******"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Select a plan</Text>
          {plansLoading ? (
            <ActivityIndicator color={colors.violet} style={{ marginVertical: spacing(4) }} />
          ) : plansError ? (
            <Text style={styles.error}>{plansError}</Text>
          ) : (
            <View style={styles.planGrid}>
              {plans.map((p) => {
                const active = p.id === planId;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.planTile, active && styles.planTileActive]}
                    onPress={() => setPlanId(p.id)}
                  >
                    <Text style={[styles.planSize, active && styles.planTextActive]} numberOfLines={2}>{p.label}</Text>
                    <Text style={[styles.planPrice, active && styles.planTextActive]}>{formatNgn(p.priceNgn)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Buy data" onPress={onBuy} loading={loading} disabled={!planId} />
      </View>

      <NetworkSelectorModal
        visible={modalVisible}
        networks={NETWORKS}
        selectedId={network}
        onSelect={(id) => { setNetwork(id); }}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(4), paddingTop: spacing(2), paddingBottom: spacing(3) },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  headerLink: { color: colors.violet, fontSize: 15, fontWeight: '600' },
  scroll: { padding: spacing(4), paddingTop: 0 },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
  selectorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing(3), height: 60, marginBottom: spacing(4) },
  selectorLeft: { flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: spacing(3) },
  phoneInput: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing(4) },
  cardLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: spacing(3) },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  planTile: { width: '31.5%', backgroundColor: colors.bg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing(3), paddingHorizontal: spacing(1), alignItems: 'center' },
  planTileActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  planSize: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: spacing(1) },
  planPrice: { color: colors.violetSoft, fontSize: 12, marginTop: spacing(1), fontWeight: '600' },
  planTextActive: { color: colors.bg },
  footer: { padding: spacing(4) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(5) },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2) },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
});
