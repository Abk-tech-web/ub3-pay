import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TextInput, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../config/theme';
import { Feather } from '@expo/vector-icons';
import TokenIcon from './TokenIcon';
import { formatUsd, formatCrypto } from '../utils/formatters';

const VIOLET = '#7C3AED';

function netInfo(chainId) {
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

function RowCard({ item, index, styles, onPress }) {
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
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const hasBalance = item.balance != null;
  const net = item.symbol === 'NGN' ? null : netInfo(item.chainId);
  return (
    <Animated.View style={[styles.cardWrap, { opacity: anim, transform: [{ translateY: translateY }, { scale: scale }] }]}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
        onPress={onPress}
        android_ripple={{ color: 'rgba(124,58,237,0.12)', borderless: false }}
      >
        <View style={styles.iconRing}>
          <TokenIcon symbol={item.symbol} size={36} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing(3) }}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          {net ? (
            <View style={styles.netPill}>
              <View style={[styles.netDot, { backgroundColor: net.dot }]} />
              <Text style={styles.netText}>{net.label}</Text>
            </View>
          ) : (
            item.name ? <Text style={styles.name}>{item.name}</Text> : null
          )}
        </View>
        {hasBalance ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.balance}>{formatCrypto(item.balance, '')}</Text>
            {item.usdValue != null ? <Text style={styles.usd}>{formatUsd(item.usdValue)}</Text> : null}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function AssetPickerModal({ visible, onClose, onSelect, assets = [], pinnedSymbol, includeNgn }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const data = useMemo(() => {
    let list = [...assets];
    if (includeNgn) {
      const hasNgn = list.some((a) => a.symbol === 'NGN');
      if (hasNgn === false) {
        list = [{ symbol: 'NGN', name: 'Nigerian Naira', usdValue: null, balance: null }, ...list];
      }
    }
    const q = query.toLowerCase();
    const filtered = query
      ? list.filter((a) => {
          const n = a.symbol === 'NGN' ? null : netInfo(a.chainId);
          const netLabel = n ? n.label.toLowerCase() : '';
          return a.symbol.toLowerCase().includes(q) || (a.name && a.name.toLowerCase().includes(q)) || netLabel.includes(q);
        })
      : list;
    return filtered.sort((a, b) => {
      if (a.symbol === pinnedSymbol && b.symbol !== pinnedSymbol) return -1;
      if (b.symbol === pinnedSymbol && a.symbol !== pinnedSymbol) return 1;
      if (includeNgn) {
        if (a.symbol === 'NGN') return -1;
        if (b.symbol === 'NGN') return 1;
      }
      const diff = (b.usdValue || 0) - (a.usdValue || 0);
      if (diff !== 0) return diff;
      if (a.symbol !== b.symbol) return a.symbol < b.symbol ? -1 : 1;
      const na = netInfo(a.chainId);
      const nb = netInfo(b.chainId);
      const la = na ? na.label : '';
      const lb = nb ? nb.label : '';
      return la < lb ? -1 : la > lb ? 1 : 0;
    });
  }, [assets, query, pinnedSymbol, includeNgn]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Select asset</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={[styles.searchBox, focused ? styles.searchBoxFocused : null]}>
            <Feather name="search" size={16} color={focused ? VIOLET : colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search token or network"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
          <FlatList
            data={data}
            keyExtractor={(a, index) => a.symbol + '-' + (a.chainId || 'x') + '-' + index}
            contentContainerStyle={{ paddingBottom: spacing(8), paddingTop: spacing(1) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <RowCard
                item={item}
                index={index}
                styles={styles}
                onPress={() => { onSelect(item.symbol); onClose(); }}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,4,30,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '82%', paddingTop: spacing(2) },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: VIOLET, opacity: 0.45, alignSelf: 'center', marginBottom: spacing(3) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing(5), marginBottom: spacing(3) },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(2), backgroundColor: colors.bgCard,
    marginHorizontal: spacing(5), paddingHorizontal: spacing(4), height: 48, borderRadius: 18,
    marginBottom: spacing(3), borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  searchBoxFocused: { borderColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.3, elevation: 5 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  cardWrap: {
    marginHorizontal: spacing(5), marginVertical: spacing(1.5), borderRadius: 22, backgroundColor: colors.bgCard,
    shadowColor: '#2a1260', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(4), paddingVertical: spacing(3.5), borderRadius: 22 },
  rowPressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  iconRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.35)', alignItems: 'center', justifyContent: 'center' },
  symbol: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  name: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  netPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)',
  },
  netDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  netText: { color: VIOLET, fontSize: 11, fontWeight: '700' },
  balance: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  usd: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
