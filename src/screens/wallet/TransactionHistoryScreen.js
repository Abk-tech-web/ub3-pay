import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import EmptyState from '../../components/EmptyState';
import { timeAgo } from '../../utils/formatters';

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    if (user) walletService.getTransactionHistory(user.uid).then(setTxs);
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={{ padding: spacing(5) }}
        data={txs}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={<EmptyState title="No transactions yet" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.type}>{item.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.time}>{timeAgo(item.at)}</Text>
            </View>
            <Text style={styles.amount}>{item.amount} {item.symbol}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  type: { color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { color: colors.textPrimary, fontWeight: '700' },
});
