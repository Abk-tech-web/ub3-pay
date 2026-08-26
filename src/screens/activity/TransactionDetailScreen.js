import React from 'react';
import { View, Text, StyleSheet, Pressable, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import { getChain } from '../../config/chains';

function statusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'completed' || s === 'confirmed') return { bg: '#0f2e22', fg: '#34d399', text: 'Success' };
  if (s === 'pending' || s === 'processing') return { bg: '#2e2a0f', fg: '#facc15', text: 'Pending' };
  if (s === 'failed' || s === 'error') return { bg: '#2e0f14', fg: '#f87171', text: 'Failed' };
  return { bg: '#232329', fg: colors.textSecondary, text: status || '—' };
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen({ route }) {
  const { item } = route.params ?? {};
  const isCrypto = !!item.txHash;
  const chain = isCrypto ? getChain(item.chainId) : null;
  const st = statusStyle(item.status);
  const isOut = item.direction === 'out';

  const openExplorer = () => {
    if (chain?.explorer && item.txHash) Linking.openURL(chain.explorer + item.txHash.replace('...', ''));
  };

  const shareReceipt = () => {
    const lines = [
      `UB3 Pay Receipt`,
      `Transaction: ${item.label}`,
      item.amount ? `Amount: ${item.symbol === 'NGN' ? '₦' : ''}${item.amount}${item.symbol && item.symbol !== 'NGN' ? ' ' + item.symbol : ''}` : null,
      `Status: ${st.text}`,
      item.reference ? `Reference: ${item.reference}` : null,
      item.bankName ? `Bank: ${item.bankName}` : null,
      `Date: ${new Date(item.at).toLocaleString()}`,
    ].filter(Boolean).join('\n');
    Share.share({ message: lines });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#2a1f4d', colors.bg]} style={styles.glow} />
      <View style={styles.body}>
        <View style={styles.center}>
          <View style={[styles.statusCircle, { backgroundColor: st.bg }]}>
            <Feather name={isOut ? 'arrow-up-right' : 'arrow-down-left'} size={28} color={st.fg} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          {item.amount != null && item.amount !== '' && (
            <Text style={[styles.amount, { color: isOut ? colors.textPrimary : '#34d399' }]}>
              {isOut ? '- ' : '+ '}{item.symbol === 'NGN' ? '₦' : ''}{item.amount}{item.symbol && item.symbol !== 'NGN' ? ` ${item.symbol}` : ''}
            </Text>
          )}
          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.fg }]}>{st.text}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row label="Date" value={new Date(item.at).toLocaleString()} />
          {isCrypto ? (
            <>
              <Row label="Network" value={chain?.name} />
              <Row label="Tx hash" value={item.txHash} />
            </>
          ) : (
            <>
              <Row label="Bank" value={item.bankName} />
              <Row label="Reference" value={item.reference} />
            </>
          )}
        </View>

        {isCrypto && item.txHash && (
          <Pressable style={styles.explorerBtn} onPress={openExplorer}>
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={styles.explorerLabel}>View on block explorer</Text>
          </Pressable>
        )}

        <Pressable style={styles.receiptBtn} onPress={shareReceipt}>
          <Feather name="share-2" size={16} color={colors.textPrimary} />
          <Text style={styles.receiptLabel}>Share receipt</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, opacity: 0.5 },
  body: { flex: 1, padding: spacing(6) },
  center: { alignItems: 'center', marginTop: spacing(6) },
  statusCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: spacing(4), textTransform: 'capitalize' },
  amount: { fontSize: 30, fontWeight: '800', marginTop: spacing(2) },
  statusPill: { marginTop: spacing(3), paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radii.pill },
  statusText: { fontSize: 12, fontWeight: '700' },
  card: {
    marginTop: spacing(8), backgroundColor: '#1c1c22', borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing(4), borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  explorerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2),
    backgroundColor: colors.violet, borderRadius: radii.pill, paddingVertical: spacing(4), marginTop: spacing(6),
  },
  explorerLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  receiptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2),
    backgroundColor: '#232329', borderRadius: radii.pill, paddingVertical: spacing(4), marginTop: spacing(3),
    borderWidth: 1, borderColor: colors.border,
  },
  receiptLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
});
