import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as baasService from '../../services/baasService';
import EmptyState from '../../components/EmptyState';
import { formatNgn, timeAgo } from '../../utils/formatters';

export default function DepositHistoryScreen() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState([]);

  useEffect(() => {
    if (user) baasService.getDepositHistory(user.uid).then(setDeposits);
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={{ padding: spacing(5) }}
        data={deposits}
        keyExtractor={(d) => d.id}
        ListEmptyComponent={<EmptyState title="No deposits yet" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.time}>{timeAgo(item.receivedAt)}</Text>
            </View>
            <Text style={styles.amount}>{formatNgn(item.amountNgn)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  status: { color: colors.success, fontWeight: '700', textTransform: 'capitalize', fontSize: 13 },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { color: colors.textPrimary, fontWeight: '700' },
});
