import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import * as baasService from '../../services/baasService';
import EmptyState from '../../components/EmptyState';
import { timeAgo } from '../../utils/formatters';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([walletService.getTransactionHistory(user.uid), baasService.getDepositHistory(user.uid)]).then(
      ([txs, deposits]) => {
        const merged = [
          ...txs.map((t) => ({ id: t.id, label: t.type.replace(/_/g, ' '), at: t.at, status: t.status })),
          ...deposits.map((d) => ({ id: d.id, label: 'naira deposit', at: d.receivedAt, status: d.status })),
        ].sort((a, b) => new Date(b.at) - new Date(a.at));
        setItems(merged);
      }
    );
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.header}>Activity</Text>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(5), paddingBottom: spacing(6) }}
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="Your transactions and deposits will show up here." />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.dot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.time}>{timeAgo(item.at)}</Text>
            </View>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', padding: spacing(5) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.violet, marginRight: spacing(3) },
  label: { color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  status: { color: colors.textSecondary, fontSize: 12, textTransform: 'capitalize' },
});
