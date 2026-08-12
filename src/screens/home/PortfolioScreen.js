import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import BalanceCard from '../../components/BalanceCard';
import AssetListItem from '../../components/AssetListItem';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';

const ACTIONS = [
  { key: 'Receive', label: 'Receive' },
  { key: 'Send', label: 'Send' },
  { key: 'BuyCrypto', label: 'Buy' },
  { key: 'Withdraw', label: 'Withdraw' },
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
                  <View style={styles.actionIcon} />
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </Pressable>
              ))}
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
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(5), marginBottom: spacing(6) },
  actionBtn: { alignItems: 'center', width: '23%' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginBottom: spacing(2) },
  actionLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  sectionHeader: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionAction: { color: colors.violetSoft, fontSize: 13, fontWeight: '600' },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
