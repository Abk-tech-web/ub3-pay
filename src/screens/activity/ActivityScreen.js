import { getChain } from '../../config/chains';
import { openReceipt } from '../../utils/receiptRows';
import AssetIcon from '../../components/AssetIcon';
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as walletService from '../../services/walletService';
import * as baasService from '../../services/baasService';
import EmptyState from '../../components/EmptyState';
import { timeAgo } from '../../utils/formatters';

const ICONS = {
  'naira deposit': { icon: 'arrow-down-left', color: '#34d399' },
  'deposit crypto': { icon: 'arrow-down-left', color: '#34d399' },
  'sol sent': { icon: 'arrow-up-right', color: '#f87171' },
  'send': { icon: 'arrow-up-right', color: '#f87171' },
  'swap crypto to ngn': { icon: 'repeat', color: '#a78bfa' },
  'swap': { icon: 'repeat', color: '#a78bfa' },
  'withdraw': { icon: 'arrow-up-right', color: '#f87171' },
  'buy': { icon: 'trending-up', color: '#60a5fa' },
  'sell': { icon: 'trending-down', color: '#fb923c' },
};

function iconFor(label) {
  const key = (label || '').toLowerCase();
  return ICONS[key] || { icon: 'activity', color: colors.violetSoft };
}

function statusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'completed' || s === 'confirmed') return { bg: '#0f2e22', fg: '#34d399', text: 'Success' };
  if (s === 'pending' || s === 'processing') return { bg: '#2e2a0f', fg: '#facc15', text: 'Pending' };
  if (s === 'failed' || s === 'error') return { bg: '#2e0f14', fg: '#f87171', text: 'Failed' };
  return { bg: '#232329', fg: colors.textSecondary, text: status || '—' };
}

function dateGroup(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function ActivityScreen({ navigation }) {
  const { user } = useAuth();
  const { portfolio } = useWallet();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([walletService.getTransactionHistory(user.uid), baasService.getDepositHistory(user.uid)]).then(
      ([txs, deposits]) => {
        const merged = [
          ...txs.map((t) => ({
            id: t.id, label: t.type.replace(/_/g, ' '), at: t.at, status: t.status,
            amount: t.amount, symbol: t.symbol, direction: t.direction,
          })),
          ...deposits.map((d) => ({
            id: d.id, label: 'naira deposit', at: d.receivedAt, status: d.status,
            amount: d.amount, symbol: 'NGN', direction: 'in',
          })),
                  ...(portfolio.activity || []),
        ].sort((a, b) => new Date(b.at) - new Date(a.at));
        setItems(merged);
      }
    );
  }, [user, portfolio.activity]);

  const sections = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const g = dateGroup(item.at);
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [items]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>History</Text>
        <Pressable style={styles.filterBtn}>
          <Feather name="sliders" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(5), paddingBottom: spacing(6) }}
        data={sections}
        keyExtractor={(s) => s.title}
        ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="Your transactions and deposits will show up here." />}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: spacing(4) }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.data.map((item, i) => {
                const isCrypto = !!(item.txHash || item.chainId);
					const isSwap = item.kind === 'swap';
					const iconKind = isSwap ? 'swap' : (isCrypto ? 'crypto' : 'bank');
                const st = statusStyle(item.status);
                const hasAmount = item.amount != null && item.amount !== '';
                const isOut = item.direction === 'out';
                return (
                  <Pressable
                    onPress={() => openReceipt(navigation, item)}$
                    key={item.id}
                    style={[styles.row, i !== section.data.length - 1 && styles.rowBorder]}
                  >
                    <AssetIcon kind={iconKind} symbol={item.symbol} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>{item.label}</Text>
                      <Text style={styles.time}>{timeAgo(item.at)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {hasAmount && (
                        <Text style={[styles.amount, { color: isOut ? colors.textPrimary : '#34d399' }]}>
                          {isOut ? '- ' : '+ '}{item.symbol === 'NGN' ? '₦' : ''}{item.amount}{item.symbol && item.symbol !== 'NGN' ? ` ${item.symbol}` : ''}
                        </Text>
                      )}
                      <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.fg }]}>{st.text}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(5), paddingTop: spacing(5), paddingBottom: spacing(3) },
  header: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  filterBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#232329', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: spacing(2) },
  card: { backgroundColor: '#1c1c22', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3), gap: spacing(3) },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '700', fontSize: 13, marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
