import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ActionButton from '../../components/ActionButton';
import BillCard from '../../components/BillCard';
import { colors, spacing, radii } from '../../config/theme';
import Logo from '../../components/Logo';
import BalanceCard from '../../components/BalanceCard';
import AssetListItem from '../../components/AssetListItem';
import NgnListItem from '../../components/NgnListItem';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';

const ACTIONS = [
  { key: 'Receive', label: 'Receive', icon: 'arrow-down-left', gradient: ['#34d399', '#059669'] },
  { key: 'Send', label: 'Send', icon: 'send', gradient: ['#60a5fa', '#2563eb'] },
  { key: 'BuyCrypto', label: 'Buy', icon: 'trending-up', gradient: ['#a78bfa', '#7c3aed'] },
  { key: 'SellCrypto', label: 'Sell', icon: 'trending-down', gradient: ['#fb923c', '#ea580c'] },
  { key: 'Withdraw', label: 'Withdraw', icon: 'arrow-up', gradient: ['#f472b6', '#db2777'] },
];

export default function PortfolioScreen({ navigation }) {
  const { user } = useAuth();
  const { portfolio, refreshing, refreshPortfolio } = useWallet();

  useEffect(() => {
    if (user) refreshPortfolio(user.uid);
    const interval = setInterval(() => { if (user) refreshPortfolio(user.uid); }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Logo size={20} />
            <BalanceCard totalUsd={portfolio.totalUsd} totalNgn={portfolio.totalNgn} totalPnl24hUsd={portfolio.totalPnl24hUsd} />

        <View style={styles.actionsRow}>
          {ACTIONS.map((a) => (
            <ActionButton key={a.key} icon={a.icon} label={a.label} gradient={a.gradient} onPress={() => navigation.navigate(a.key)} />
          ))}
        </View>

        <View style={styles.billsRow}>
          <BillCard icon="phone" label="Airtime" accent="#34d399" onPress={() => navigation.navigate('Airtime')} />
          <BillCard icon="wifi" label="Data" accent="#60a5fa" onPress={() => navigation.navigate('Data')} />
        </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Assets</Text>
              <Pressable onPress={() => navigation.navigate('AddCustomToken')}>
                <Text style={styles.sectionAction}>Add token</Text>
              </Pressable>
            </View>
          </>
        }
        data={[{ symbol: 'NGN', balance: portfolio.ngnBalance ?? 0 }, ...(portfolio.assets || [])]}
        keyExtractor={(item, i) => `${item.chainId}-${item.symbol}-${i}`}
        renderItem={({ item }) => (
          item.symbol === 'NGN' ? (<NgnListItem balance={item.balance} onPress={() => navigation.navigate('NairaDetail')} />) : (<AssetListItem asset={item} onPress={() => navigation.navigate('AssetDetail', { asset: item })} />)
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
