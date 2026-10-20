import { openReceipt } from '../../utils/receiptRows';
import AssetIcon from '../../components/AssetIcon';
import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, Pressable, Animated, Easing, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as walletService from '../../services/walletService';
import * as baasService from '../../services/baasService';
import EmptyState from '../../components/EmptyState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UB3Loader from '../../components/UB3Loader';

import { timeAgo } from '../../utils/formatters';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';

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
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function TxCard({ item, index, styles, colors, navigation }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 8) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const isCrypto = !!(item.txHash || item.chainId);
  const isSwap = item.kind === 'swap';
  const iconKind = isSwap ? 'swap' : (isCrypto ? 'crypto' : 'bank');
  const st = statusStyle(item.status, colors);
  const hasAmount = item.amount != null && item.amount !== '';
  const isOut = item.direction === 'out';
  const ringColor = isSwap ? 'rgba(124,58,237,0.4)' : (isOut ? 'rgba(248,113,113,0.45)' : 'rgba(16,185,129,0.45)');
  let amountText = '';
  if (hasAmount) {
    const num = typeof item.amount === 'number' ? item.amount.toFixed(8).replace(/\.?0+$/, '') : item.amount;
    amountText = (isOut ? '- ' : '+ ') + (item.symbol === 'NGN' ? '\u20A6' : '') + num + (item.symbol && item.symbol !== 'NGN' ? ' ' + item.symbol : '');
  }
  return (
    <Animated.View style={[styles.card, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      <Pressable
        onPress={() => openReceipt(navigation, item)}
        style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
        android_ripple={{ color: 'rgba(124,58,237,0.12)' }}
      >
        <View style={[styles.iconRing, { borderColor: ringColor }]}>
          <AssetIcon kind={iconKind} symbol={item.symbol} size={40} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.time}>{timeAgo(item.at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {hasAmount ? (
            <Text style={[styles.amount, { color: isOut ? colors.textPrimary : '#10b981' }]}>{amountText}</Text>
          ) : null}
          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.fg }]}>{st.text}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const TYPE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'Received' },
  { key: 'out', label: 'Sent' },
  { key: 'swap', label: 'Swaps' },
  { key: 'ngn', label: 'Naira' },
];
const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

function matchesType(item, type) {
  if (type === 'all') return true;
  const isSwap = item.kind === 'swap' || String(item.label || '').toLowerCase().indexOf('swap') >= 0;
  if (type === 'swap') return isSwap;
  if (type === 'ngn') return item.symbol === 'NGN';
  if (isSwap) return false;
  return item.direction === type;
}

function matchesStatus(item, status, colors) {
  if (status === 'all') return true;
  return statusStyle(item.status, colors).text.toLowerCase() === status;
}

function FilterSheet({ visible, onClose, typeFilter, statusFilter, setTypeFilter, setStatusFilter, styles }) {
  const renderChip = (opt, current, setter) => {
    const active = current === opt.key;
    return (
      <Pressable key={opt.key} onPress={() => setter(opt.key)} style={[styles.chip, active ? styles.chipActive : null]}>
        <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{opt.label}</Text>
      </Pressable>
    );
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.fOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.fSheet}>
          <View style={styles.fHandle} />
          <Text style={styles.fTitle}>Filter history</Text>
          <Text style={styles.fGroup}>TYPE</Text>
          <View style={styles.fChips}>{TYPE_OPTIONS.map((o) => renderChip(o, typeFilter, setTypeFilter))}</View>
          <Text style={styles.fGroup}>STATUS</Text>
          <View style={styles.fChips}>{STATUS_OPTIONS.map((o) => renderChip(o, statusFilter, setStatusFilter))}</View>
          <View style={styles.fBtnRow}>
            <Pressable style={styles.fReset} onPress={() => { setTypeFilter('all'); setStatusFilter('all'); }}>
              <Text style={styles.fResetText}>Reset</Text>
            </Pressable>
            <Pressable style={styles.fDone} onPress={onClose}>
              <Text style={styles.fDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ActivityScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const { portfolio } = useWallet();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const cacheKey = 'ub3_history_cache_v1_' + (user ? user.uid : '');

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    AsyncStorage.getItem(cacheKey).then((raw) => {
      if (!alive || loadedRef.current || !raw) return;
      try {
        const c = JSON.parse(raw);
        if (Array.isArray(c) && c.length) { setItems(c); loadedRef.current = true; setLoaded(true); }
      } catch (e) {}
    }).catch(() => {});
    return () => { alive = false; };
  }, [cacheKey]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const activeCount = (typeFilter === 'all' ? 0 : 1) + (statusFilter === 'all' ? 0 : 1);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      Promise.all([walletService.getTransactionHistory(user.uid), baasService.getDepositHistory(user.uid)]).catch(() => { loadedRef.current = true; setLoaded(true); return null; }).then(
        (res) => {
                                if (!res) return;
                                const [txs, deposits] = res;
          const merged = [
            ...txs.map((t) => ({
              id: t.id, label: t.type === 'ngn_transfer' ? (t.direction === 'in' ? 'naira received' : 'naira sent') : t.type.replace(/_/g, ' '), at: t.at, status: t.status,
              amount: t.amount, symbol: t.symbol, direction: t.direction, chainId: t.chainId, txHash: t.txHash, toAddress: t.toAddress, toUb3Id: t.toUb3Id, fromAddress: t.fromAddress, fromUb3Id: t.fromUb3Id, counterpartyName: t.counterpartyName,
            })),
            ...deposits.map((d) => ({
              id: d.id, label: 'naira deposit', at: d.receivedAt, status: d.status,
              amount: d.amount, symbol: 'NGN', direction: 'in',
            })),
            ...(portfolio.activity || []),
          ].sort((a, b) => new Date(b.at) - new Date(a.at));
          setItems(merged);
                                loadedRef.current = true;
                                setLoaded(true);
                                AsyncStorage.setItem(cacheKey, JSON.stringify(merged.slice(0, 60))).catch(() => {});
        }
      );
    }, [user, portfolio.activity])
  );

  const sections = useMemo(() => {
    const groups = {};
    items.filter((it) => matchesType(it, typeFilter) && matchesStatus(it, statusFilter, colors)).forEach((item) => {
      const g = dateGroup(item.at);
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [items, typeFilter, statusFilter, colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>History</Text>
          <Text style={styles.headerSub}>Your transactions and deposits</Text>
        </View>
        <Pressable onPress={() => setFilterOpen(true)} style={({ pressed }) => [styles.filterBtn, pressed ? styles.rowPressed : null]}>
          <Feather name="sliders" size={18} color={VIOLET} />
          {activeCount > 0 ? <View style={styles.filterDot} /> : null}
        </Pressable>
      </View>
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        setTypeFilter={setTypeFilter}
        setStatusFilter={setStatusFilter}
        styles={styles}
      />
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(5), paddingBottom: spacing(24) }}
        data={sections}
        keyExtractor={(s) => s.title}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loaded ? (
          items.length > 0
            ? <EmptyState title="No matches" subtitle="Try changing the filter." />
            : <EmptyState title="Nothing here yet" subtitle="Your transactions and deposits will show up here." />
        ) : (
          <View style={{ alignItems: 'center', marginTop: 70 }}>
            <UB3Loader size={96} color={VIOLET} />
          </View>
        )}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: spacing(3) }}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.data.map((item, i) => (
              <TxCard key={item.id} item={item} index={i} styles={styles} colors={colors} navigation={navigation} />
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(5), paddingTop: spacing(5), paddingBottom: spacing(4) },
  header: { color: colors.textPrimary, fontSize: 28, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 16, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.18)',
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2), marginTop: spacing(1) },
  sectionBar: { width: 4, height: 16, borderRadius: 2, backgroundColor: VIOLET, marginRight: 8 },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, marginVertical: spacing(1.5),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3.5), gap: spacing(3), borderRadius: 22 },
  rowPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  iconRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textPrimary, fontWeight: '800', fontSize: 14, textTransform: 'capitalize' },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  amount: { fontWeight: '800', fontSize: 13, marginBottom: 5 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: VIOLET, borderWidth: 2, borderColor: colors.bgCard },
  fOverlay: { flex: 1, backgroundColor: 'rgba(10,4,30,0.6)', justifyContent: 'flex-end' },
  fSheet: { backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing(5), paddingBottom: spacing(8) },
  fHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: VIOLET, opacity: 0.45, alignSelf: 'center', marginBottom: spacing(4) },
  fTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: spacing(3) },
  fGroup: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: spacing(3), marginBottom: spacing(2) },
  fChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.bgCard,
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.2)',
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  chipActive: { backgroundColor: VIOLET, borderColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.4 },
  chipText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  fBtnRow: { flexDirection: 'row', gap: 12, marginTop: spacing(6) },
  fReset: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3.5), borderRadius: 999, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.25)' },
  fResetText: { color: VIOLET, fontWeight: '800', fontSize: 15 },
  fDone: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3.5), borderRadius: 999, backgroundColor: VIOLET,
    shadowColor: VIOLET, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 8,
  },
  fDoneText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
