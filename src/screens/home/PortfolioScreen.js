import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ActionButton from '../../components/ActionButton';
import { spacing } from '../../config/theme';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import BalanceCard from '../../components/BalanceCard';
import AssetListItem from '../../components/AssetListItem';
import NgnListItem from '../../components/NgnListItem';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { groupAssetsBySymbol } from '../../services/walletService';
import { useWallet } from '../../context/WalletContext';

const ACTIONS = [
  { key: 'Receive', label: 'Receive', icon: 'arrow-down-left', gradient: ['#34d399', '#059669'] },
  { key: 'Send', label: 'Send', icon: 'send', gradient: ['#60a5fa', '#2563eb'] },
  { key: 'BuyCrypto', label: 'Buy', icon: 'trending-up', gradient: ['#a78bfa', '#7c3aed'] },
  { key: 'SellCrypto', label: 'Sell', icon: 'trending-down', gradient: ['#fb923c', '#ea580c'] },
  { key: 'Withdraw', label: 'Withdraw', icon: 'arrow-up', gradient: ['#f472b6', '#db2777'] },
  { key: 'Airtime', label: 'Airtime', icon: 'phone', gradient: ['#2dd4bf', '#0d9488'] },
  { key: 'Data', label: 'Data', icon: 'wifi', gradient: ['#818cf8', '#4f46e5'] },
];

export default function PortfolioScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);
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
            <View style={styles.topRow}>
              <Logo size={20} />
              <Pressable onPress={toggleTheme} style={styles.themeToggle} hitSlop={10}>
                <Feather name={isDark ? 'moon' : 'sun'} size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
            <BalanceCard totalUsd={portfolio.totalUsd} totalNgn={portfolio.totalNgn} totalPnl24hUsd={portfolio.totalPnl24hUsd} />

            <View style={styles.actionsRow}>
              {ACTIONS.map((a) => (
                <ActionButton
                  key={a.key}
                  icon={a.icon}
                  label={a.label}
                  gradient={a.gradient}
                  style={styles.actionItem}
                  onPress={() => navigation.navigate(a.key)}
                />
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
        data={[{ symbol: 'NGN', balance: portfolio.ngnBalance ?? 0 }, ...groupAssetsBySymbol(portfolio.assets || [])]}
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

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing(5) },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(3) },
  themeToggle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: spacing(3),
    rowGap: spacing(4),
    marginTop: spacing(5),
    marginBottom: spacing(4),
  },
  actionItem: { width: '21%' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  sectionHeader: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionAction: { color: colors.violetSoft, fontSize: 13, fontWeight: '600' },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
