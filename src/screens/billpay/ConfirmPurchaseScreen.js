import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useWallet } from '../../context/WalletContext';
import { formatNgn } from '../../utils/formatters';
import { NETWORKS } from '../../services/billService';
import NetworkIcon from '../../components/NetworkIcon';

export default function ConfirmPurchaseScreen({ navigation, route }) {
  const { kind, network, phone, amount, planLabel, planId } = route.params;
  const networkObj = NETWORKS.find((n) => n.id === network);
  const { portfolio } = useWallet();
  const balance = portfolio?.ngnBalance ?? 0;
  const insufficient = balance < amount;

  const productLabel = kind === 'data' ? 'Mobile Data' : 'Airtime';

  const onProceed = () => {
    navigation.navigate('BillConfirmPin', { kind, network, phone, amount, planLabel, planId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.amount}>{formatNgn(amount)}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Product</Text>
            <View style={styles.productValue}>
              <NetworkIcon network={networkObj} size={20} />
              <Text style={styles.value}>{productLabel}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Recipient</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>
          {planLabel ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Plan</Text>
                <Text style={styles.value}>{planLabel}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatNgn(amount)}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={[styles.balanceValue, insufficient && styles.balanceInsufficient]}>
            {formatNgn(balance)}
          </Text>
          {insufficient ? <Text style={styles.insufficientText}>Insufficient balance</Text> : null}
        </View>

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Proceed" onPress={onProceed} disabled={insufficient} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  amount: { color: colors.textPrimary, fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: spacing(6) },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing(4), marginBottom: spacing(4) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing(2) },
  divider: { height: 1, backgroundColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  productValue: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  balanceCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing(4) },
  balanceLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1) },
  balanceValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  balanceInsufficient: { color: colors.danger },
  insufficientText: { color: colors.danger, fontSize: 13, marginTop: spacing(2) },
});
