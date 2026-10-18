import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VIOLET = '#7C3AED';

export function netInfo(chainId) {
  if (chainId == null || chainId === '') return null;
  const raw = String(chainId);
  const k = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (k.indexOf('arb') >= 0) return { label: 'Arbitrum', dot: '#28A0F0' };
  if (k.indexOf('opt') >= 0 || k === 'op') return { label: 'Optimism', dot: '#FF0420' };
  if (k.indexOf('bsc') >= 0 || k.indexOf('bnb') >= 0 || k.indexOf('binance') >= 0) return { label: 'BSC', dot: '#F3BA2F' };
  if (k.indexOf('sol') >= 0) return { label: 'Solana', dot: '#14F195' };
  if (k.indexOf('base') >= 0) return { label: 'Base', dot: '#0052FF' };
  if (k.indexOf('btc') >= 0 || k.indexOf('bitcoin') >= 0) return { label: 'Bitcoin', dot: '#F7931A' };
  if (k.indexOf('eth') >= 0 || k.indexOf('mainnet') >= 0) return { label: 'Ethereum', dot: '#627EEA' };
  return { label: raw.charAt(0).toUpperCase() + raw.slice(1), dot: VIOLET };
}

export default function NetworkPills({ chainIds = [], center }) {
  const seen = {};
  const list = [];
  chainIds.forEach((id) => {
    const n = netInfo(id);
    if (n && seen[n.label] !== 1) {
      seen[n.label] = 1;
      list.push(n);
    }
  });
  return (
    <View style={[styles.wrap, center ? styles.center : null]}>
      {list.map((n) => (
        <View key={n.label} style={styles.pill}>
          <View style={[styles.dot, { backgroundColor: n.dot }]} />
          <Text style={styles.text}>{n.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  center: { justifyContent: 'center', marginTop: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { color: VIOLET, fontSize: 10.5, fontWeight: '700' },
});
