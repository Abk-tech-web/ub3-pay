import React, { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import * as baasService from '../../services/baasService';
import * as walletService from '../../services/walletService';
import AssetIcon from '../../components/AssetIcon';
import UB3Loader from '../../components/UB3Loader';
import { formatNgn, timeAgo } from '../../utils/formatters';
import { openReceipt } from '../../utils/receiptRows';

const SHADOW = '#2a1260';
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'transfer', label: 'Transfers' },
];

function statusStyle(status, colors) {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'completed' || s === 'confirmed') return { bg: 'rgba(16,185,129,0.14)', fg: '#10b981', text: 'Success' };
  if (s === 'pending' || s === 'processing') return { bg: 'rgba(250,204,21,0.18)', fg: '#ca8a04', text: 'Pending' };
  if (s === 'failed' || s === 'error') return { bg: 'rgba(248,113,113,0.16)', fg: '#ef4444', text: 'Failed' };
  return { bg: colors.bgElevated, fg: colors.textSecondary, text: status || '-' };
}

function dateGroup(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function Row({ item, index, styles, colors, onPress }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 300, delay: Math.min(index, 8) * 45, useNativeDriver: true }).start();
  }, []);
  const st = statusStyle(item.status, colors);
  const isOut = item.direction === 'out';
  const ring = isOut ? 'rgba(248,113,113,0.45)' : 'rgba(16,185,129,0.45)';
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}>
        <View style={[styles.ring, { borderColor: ring }]}>
          <AssetIcon kind="bank" symbol="NGN" size={38} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.time}>{timeAgo(item.at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: isOut ? colors.textPrimary : '#10b981' }]}>
            {isOut ? '- ' : '+ '}{formatNgn(item.amount)}
          </Text>
          <View style={[styles.pill, { backgroundColor: st.bg }]}>
            <Text style={[styles.pillText, { color: st.fg }]}>{st.text}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DepositHistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('all');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    if (!user) return;
    let deposits = [];
    let txs = [];
    try { deposits = await baasService.getDepositHistory(user.uid); } catch (e) {}
    try { txs = await walletService.getTransactionHistory(user.uid); } catch (e) {}
    const fromDeposits = deposits.map((d) => ({
      id: 'dep_' + d.id, kind: 'deposit', label: 'naira deposit', at: d.receivedAt, status: d.status,
      amount: d.amountNgn != null ? d.amountNgn : d.amount, symbol: 'NGN', direction: 'in', reference: d.reference,
    }));
    const fromTx = txs.filter((t) => t.symbol === 'NGN').map((t) => {
      const w = t.type === 'ngn_withdrawal';
      return {
        id: t.id, kind: w ? 'withdrawal' : 'transfer',
        label: w ? 'naira withdrawal' : (t.direction === 'in' ? 'naira received' : 'naira sent'),
        at: t.at, status: t.status, amount: t.amount, symbol: 'NGN', direction: t.direction,
        toUb3Id: t.toUb3Id, fromUb3Id: t.fromUb3Id, counterpartyName: t.counterpartyName,
        bankName: t.bankName, accountNumber: t.accountNumber, accountName: t.accountName, reference: t.reference, fee: t.fee,
      };
    });
    const merged = [...fromDeposits, ...fromTx].sort((a, b) => new Date(b.at) - new Date(a.at));
    setItems(merged);
    setLoaded(true);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections = useMemo(() => {
    const groups = {};
    items.filter((it) => filter === 'all' || it.kind === filter).forEach((item) => {
      const g = dateGroup(item.at);
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [items, filter]);

  const renderEmpty = () => {
    if (!loaded) {
      return (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <UB3Loader size={96} color={colors.violet} />
        </View>
      );
    }
    const msg = {
      all: 'Your naira deposits, withdrawals and transfers will show up here.',
      deposit: 'No deposits yet. Money sent to your account number will show up here.',
      withdrawal: 'No withdrawals yet.',
      transfer: 'No UB3 ID transfers yet.',
    }[filter];
    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyCircle}>
          <Feather name="inbox" size={28} color={colors.violet} />
        </View>
        <Text style={styles.emptyTitle}>No naira transactions yet</Text>
        <Text style={styles.emptySub}>{msg}</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.heroTitle}>Naira transactions</Text>
            <Text style={styles.heroSub}>Deposits, withdrawals and transfers</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && { color: '#fff' }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <SectionList
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty()}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionRow}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Row item={item} index={index} styles={styles} colors={colors} onPress={() => openReceipt(navigation, item)} />
        )}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 26, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -70, left: -50, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  filterWrap: { paddingVertical: 14 },
  chip: {
    height: 38, paddingHorizontal: 18, borderRadius: 19, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', marginRight: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.violet, borderColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  chipText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  sectionBar: { width: 4, height: 16, borderRadius: 2, backgroundColor: colors.violet, marginRight: 8 },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 22, padding: 14, marginBottom: 12,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  ring: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textPrimary, fontWeight: '800', fontSize: 14, textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  amount: { fontWeight: '800', fontSize: 14, marginBottom: 5 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
});
