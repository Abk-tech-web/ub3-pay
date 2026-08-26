import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { NETWORKS, buyAirtime } from '../../services/billService';
import { isPositiveAmount } from '../../utils/validators';
import { formatNgn } from '../../utils/formatters';
import NetworkIcon from '../../components/NetworkIcon';
import NetworkSelectorModal from '../../components/NetworkSelectorModal';

const QUICK_AMOUNTS = [50, 100, 200, 1000, 2000, 10000];

export default function AirtimeScreen({ navigation }) {
  const { user } = useAuth();
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const selectedNetwork = NETWORKS.find((n) => n.id === network);

  const onBuy = () => {
    setError('');
    if (phone.length < 10) return setError('Enter a valid phone number.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount.');
    navigation.navigate('ConfirmPurchase', {
      kind: 'airtime',
      network,
      phone,
      amount: parseFloat(amount),
    });
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
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Airtime</Text>
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
          <Text style={styles.cardLabel}>Select Amount</Text>
          <View style={styles.amountGrid}>
            {QUICK_AMOUNTS.map((a) => {
              const active = amount === String(a);
              return (
                <Pressable
                  key={a}
                  style={[styles.amountTile, active && styles.amountTileActive]}
                  onPress={() => setAmount(String(a))}
                >
                  <Text style={[styles.amountValue, active && styles.amountValueActive]}>{formatNgn(a)}</Text>
                  <Text style={[styles.amountPay, active && styles.amountPayActive]}>Pay {formatNgn(a)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.customRow}>
            <Text style={styles.nairaSign}>₦</Text>
            <TextInput
              style={styles.customInput}
              placeholder="50-500,000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <PrimaryButton title="Pay" onPress={onBuy} loading={loading} style={styles.payBtn} />
          </View>
        </View>
      </ScrollView>

      <NetworkSelectorModal
        visible={modalVisible}
        networks={NETWORKS}
        selectedId={network}
        onSelect={setNetwork}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(4) },
  amountTile: { width: '31.5%', backgroundColor: colors.bg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing(3), alignItems: 'center' },
  amountTileActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  amountValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  amountValueActive: { color: colors.bg },
  amountPay: { color: colors.textSecondary, fontSize: 11, marginTop: spacing(1) },
  amountPayActive: { color: colors.bg },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  nairaSign: { color: colors.textSecondary, fontSize: 16 },
  customInput: { flex: 1, color: colors.textPrimary, fontSize: 15, backgroundColor: colors.bg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, height: 48, paddingHorizontal: spacing(3) },
  payBtn: { paddingHorizontal: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(5) },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2) },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
});
