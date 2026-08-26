import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../context/WalletContext';

export default function NairaDetailScreen({ navigation }) {
  const { portfolio } = useWallet();
  const ngnBalance = portfolio.ngnBalance;

  const comingSoon = (feature) => {
    Alert.alert('Coming soon', feature + ' is not available yet.');
  };

  const goToSwap = () => {
    navigation.navigate('SwapTab', {
      screen: 'Swap',
      params: { symbol: 'NGN' },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Naira</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.ngnIconCircle}>
          <Text style={styles.ngnSymbol}>NGN</Text>
        </View>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceAmount}>
          {(ngnBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('NairaWithdraw')}
        >
          <View style={styles.actionIconCircle}>
            <Ionicons name="arrow-up" size={20} color="#008751" />
          </View>
          <Text style={styles.actionLabel}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('NairaTab', { screen: 'NairaAccount' })}
        >
          <View style={styles.actionIconCircle}>
            <Ionicons name="arrow-down" size={20} color="#008751" />
          </View>
          <Text style={styles.actionLabel}>Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={goToSwap}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="swap-horizontal" size={20} color="#008751" />
          </View>
          <Text style={styles.actionLabel}>Swap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  balanceCard: { alignItems: 'center', paddingVertical: 32 },
  ngnIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ngnSymbol: { fontSize: 16, fontWeight: '700', color: '#008751' },
  balanceLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  balanceAmount: { fontSize: 30, fontWeight: '700', color: '#111' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingTop: 8,
  },
  actionButton: { alignItems: 'center' },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 13, color: '#333', fontWeight: '500' },
});
