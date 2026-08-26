import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as baasService from '../../services/baasService';
import EmptyState from '../../components/EmptyState';
import AssetIcon from '../../components/AssetIcon';
import { formatNgn, timeAgo } from '../../utils/formatters';
import { openReceipt } from '../../utils/receiptRows';

function statusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'completed' || s === 'confirmed') {
    return { bg: '#0f2e22', fg: '#34d399', text: 'Success' };
  }
  if (s === 'pending' || s === 'processing') {
    return { bg: '#2e2a0f', fg: '#facc15', text: 'Pending' };
  }
  if (s === 'failed' || s === 'error') {
    return { bg: '#2e0f14', fg: '#f87171', text: 'Failed' };
  }
  return { bg: '#232329', fg: colors.textSecondary, text: status || '-' };
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

export default function DepositHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const { portfolio } = useWallet();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    baasService.getDepositHistory(user.uid).then((deposits) => {
      const fromDeposits = deposits.map((d) => ({
        id: d.id,
        label: 'naira deposit',
        at: d.receivedAt,
        status: d.status,
        amount: d.amount,
        symbol: 'NGN',
        direction: 'in',
      }));
      const fromActivity = (portfolio.activity || []).filter((a) => a.symbol === 'NGN');
      const merged = [...fromDeposits, ...fromActivity].sort(
        (a, b) => new Date(b.at) - new Date(a.at)
      );
      setItems(merged);
    });
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
        <Text style={styles.header}>Naira Transactions</Text>
      </View>
      <SectionList
        contentContainerStyle={{ padding: spacing(5) }}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No naira transactions yet" />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const st = statusStyle(item.status);
          const isOut = item.direction === 'out';
          return (
            <Pressable
              onPress={() => openReceipt(navigation, item)}
              style={[
                styles.row,
                index !== section.data.length - 1 && styles.rowBorder,
              ]}
            >
              <AssetIcon kind="bank" symbol="NGN" size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.time}>{timeAgo(item.at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: isOut ? colors.textPrimary : '#34d399' }]}>
                  {isOut ? '- ' : '+ '}{formatNgn(item.amount)}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.fg }]}>{st.text}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { paddingHorizontal: spacing(5), paddingTop: spacing(4) },
  header: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(4), marginBottom: spacing(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c22',
    padding: spacing(3),
    gap: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '700', fontSize: 13, marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
