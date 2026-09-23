import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as walletService from '../../services/walletService';
import EmptyState from '../../components/EmptyState';
import { timeAgo } from '../../utils/formatters';

export default function TransactionHistoryScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const navigation = useNavigation();
  const [txs, setTxs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (user) walletService.getTransactionHistory(user.uid).then(setTxs);
    }, [user])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={{ padding: spacing(5) }}
        data={txs}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={<EmptyState title="No transactions yet" />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('TransactionReceipt', {
              amountPrefix: item.type === 'send' ? '-' : '+',
              amount: `${item.amount} ${item.symbol}`,
              topRightLabel: item.type === 'send' ? 'Sent' : 'Received',
              rows: [
                ...(item.toAddress ? [{ label: 'To', value: item.toAddress }] : []),
                { label: 'Network', value: item.chainId },
                { label: 'Tx Hash', value: item.txHash, copyValue: item.txHash },
              ],
              date: item.at,
            })}
          >
            <View>
              <Text style={styles.type}>{item.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.time}>{timeAgo(item.at)}</Text>
            </View>
            <Text style={styles.amount}>{item.amount} {item.symbol}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  type: { color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { color: colors.textPrimary, fontWeight: '700' },
});
