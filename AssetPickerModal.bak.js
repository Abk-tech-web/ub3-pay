import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../config/theme';
import { Feather } from '@expo/vector-icons';
import TokenIcon from './TokenIcon';
import { formatUsd, formatCrypto } from '../utils/formatters';

// assets: portfolio assets [{symbol, name, usdValue, balance}]
// pinnedSymbol: a symbol (or 'NGN') that always appears first regardless of balance
// includeNgn: adds a synthetic NGN row (Nigeria flag) - used on the Buy side
export default function AssetPickerModal({ visible, onClose, onSelect, assets = [], pinnedSymbol, includeNgn }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    let list = [...assets];
    if (includeNgn) {
      list = [{ symbol: 'NGN', name: 'Nigerian Naira', usdValue: null, isNgn: true }, ...list];
    }
    const filtered = query
      ? list.filter((a) => a.symbol.toLowerCase().includes(query.toLowerCase()) || a.name?.toLowerCase().includes(query.toLowerCase()))
      : list;
    return filtered.sort((a, b) => {
      if (a.symbol === pinnedSymbol) return -1;
      if (b.symbol === pinnedSymbol) return 1;
      if (a.isNgn) return -1;
      if (b.isNgn) return 1;
      return (b.usdValue ?? 0) - (a.usdValue ?? 0);
    });
  }, [assets, query, pinnedSymbol, includeNgn]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Select asset</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <FlatList
            data={data}
            keyExtractor={(a, index) => `${a.symbol}-${index}`}
            contentContainerStyle={{ paddingBottom: spacing(8) }}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => { onSelect(item.symbol); onClose(); }}>
                {item.isNgn ? (
                  <View style={styles.flagCircle}><Text style={{ fontSize: 20 }}>🇳🇬</Text></View>
                ) : (
                  <TokenIcon symbol={item.symbol} size={36} />
                )}
                <View style={{ flex: 1, marginLeft: spacing(3) }}>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                {!item.isNgn && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.balance}>{formatCrypto(item.balance, '')}</Text>
                    <Text style={styles.usd}>{formatUsd(item.usdValue)}</Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.lg + 8, borderTopRightRadius: radii.lg + 8, maxHeight: '80%', paddingTop: spacing(2) },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing(3) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing(5), marginBottom: spacing(3) },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), backgroundColor: colors.bgCard, marginHorizontal: spacing(5), paddingHorizontal: spacing(3), height: 44, borderRadius: radii.md, marginBottom: spacing(3), borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(5), paddingVertical: spacing(3) },
  flagCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  symbol: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  name: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  balance: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  usd: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
