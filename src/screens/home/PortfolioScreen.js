import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import BalanceCard from '../../components/BalanceCard';
import AssetListItem from '../../components/AssetListItem';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';

const ACTIONS = [
  { key: 'Receive', label: 'Receive', icon: 'arrow-down-left' },
  { key: 'Send', label: 'Send', icon: 'arrow-up-right' },
  { key: 'BuyCrypto', label: 'Buy', icon: 'plus-circle' },
  { key: 'SellCrypto', label: 'Sell', icon: 'minus-circle' },
  { key: 'Withdraw', label: 'Withdraw', icon: 'log-out' },
];

export default function PortfolioScreen({ navigation }) {
  const { user } = useAuth();
  const { portfolio, refreshing, refreshPortfolio } = useWallet();

  useEffect(() => {
    if (user) refreshPortfolio(user.uid);
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>Ub3 Pay</Text>
            <BalanceCard totalUsd={portfolio.totalUsd} totalNgn={portfolio.totalNgn} />

            <View style={styles.actionsRow}>
              {ACTIONS.map((a) => (
                <Pressable key={a.key} style={styles.actionBtn} onPress={() => navigation.navigate(a.key)}>
                  <View style={styles.actionIcon}>
                    <Feather name={a.icon} size={20} color={colors.violetSoft} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.billsRow}>
              <Pressable style={styles.billBtn} onPress={() => navigation.navigate('Airtime')}>
                <Feather name="phone" size={18} color={colors.violetSoft} />
                <Text style={styles.billLabel}>Airtime</Text>
              </Pressable>
              <Pressable style={styles.billBtn} onPress={() => navigation.navigate('Data')}>
                <Feather name="wifi" size={18} color={colors.violetSoft} />
                <Text style={styles.billLabel}>Data</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Assets</Text>
              <Pressable onPress={() => navigation.navigate('AddCustomToken')}>
                <Text style={styles.sectionAction}>Add token</Text>
              </Pressable>
            </View>
          </>
        }
        data={portfolio.assets}
        keyExtractor={(item, i) => `${item.chainId}-${item.symbol}-${i}`}
        renderItem={({ item }) => (
          <AssetListItem asset={item} onPress={() => navigation.navigate('AssetDetail', { asset: item })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState title="No assets yet" subtitle="Deposit crypto or buy with Naira to get started." />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => user && refreshPortfolio(user.uid)} tintColor={colors.violetSoft} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing(5) },
  greeting: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing(3) },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(5), marginBottom: spacing(4) },
  actionBtn: { alignItems: 'center', width: '18%' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginBottom: spacing(2), alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  billsRow: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(6) },
  billBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2), backgroundColor: colors.bgCard, borderRadius: radii.md, paddingVertical: spacing(3), borderWidth: 1, borderColor: colors.border },
  billLabel: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  sectionHeader: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionAction: { color: colors.violetSoft, fontSize: 13, fontWeight: '600' },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
