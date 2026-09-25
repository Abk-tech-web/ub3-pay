import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { truncateAddress } from '../../utils/formatters';
import { getFavourites, addFavourite, removeFavourite, getRecents } from '../../services/favouritesService';

export default function SelectRecipientScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { targetRoute = 'SendAmount', chainId, symbol } = route.params ?? {};

  const [tab, setTab] = useState('favourites');
  const [favourites, setFavourites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, r] = await Promise.all([getFavourites(), getRecents()]);
      setFavourites(f);
      setRecents(r);
    } catch (e) {
      // silent - list just stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pick = (address) => {
    navigation.navigate(targetRoute, { chainId, symbol, selectedAddress: address });
  };

  const onAddFavourite = async () => {
    if (!newAddress.trim() || !newLabel.trim()) {
      Alert.alert('Missing info', 'Enter a label and an address.');
      return;
    }
    try {
      await addFavourite(newLabel.trim(), newAddress.trim());
      setNewAddress('');
      setNewLabel('');
      load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save favourite.');
    }
  };

  const onRemoveFavourite = (id) => {
    Alert.alert('Remove favourite', 'Remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeFavourite(id); load(); } catch (e) {}
      } },
    ]);
  };

  const data = tab === 'favourites' ? favourites : recents;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Recipient</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'favourites' && styles.tabActive]}
          onPress={() => setTab('favourites')}
        >
          <Text style={[styles.tabText, tab === 'favourites' && styles.tabTextActive]}>Favourites</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'recents' && styles.tabActive]}
          onPress={() => setTab('recents')}
        >
          <Text style={[styles.tabText, tab === 'recents' && styles.tabTextActive]}>Recents</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item.id || item.address + idx}
        contentContainerStyle={{ paddingBottom: spacing(4) }}
        ListEmptyComponent={!loading ? (
          <Text style={styles.empty}>
            {tab === 'favourites' ? 'No saved addresses yet.' : 'No recent sends yet.'}
          </Text>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => pick(item.address)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.label || item.address).slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{item.label || truncateAddress(item.address)}</Text>
              <Text style={styles.rowSub}>
                {item.label ? truncateAddress(item.address) : (item.symbol || '')}
              </Text>
            </View>
            {tab === 'favourites' && (
              <TouchableOpacity onPress={() => onRemoveFavourite(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />

      {tab === 'favourites' && (
        <View style={styles.addBox}>
          <TextInput
            placeholder="Label (e.g. My CEX wallet)"
            placeholderTextColor={colors.textSecondary}
            value={newLabel}
            onChangeText={setNewLabel}
            style={styles.input}
          />
          <TextInput
            placeholder="Address"
            placeholderTextColor={colors.textSecondary}
            value={newAddress}
            onChangeText={setNewAddress}
            autoCapitalize="none"
            style={styles.input}
          />
          <TouchableOpacity style={styles.addBtn} onPress={onAddFavourite}>
            <Text style={styles.addBtnText}>Add favourite</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(5), paddingTop: spacing(3), paddingBottom: spacing(2) },
  back: { color: colors.textPrimary, fontSize: 22 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing(5), marginBottom: spacing(2), gap: spacing(2) },
  tab: { paddingVertical: spacing(1.5), paddingHorizontal: spacing(4), borderRadius: radii.md, backgroundColor: colors.bgCard },
  tabActive: { backgroundColor: colors.textPrimary },
  tabText: { color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.bg },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing(8) },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(5), paddingVertical: spacing(3), gap: spacing(3) },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.textPrimary, fontWeight: '700' },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  remove: { color: colors.danger, fontSize: 12 },
  addBox: { padding: spacing(4), borderTopWidth: 1, borderTopColor: colors.border, gap: spacing(2) },
  input: { backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md, height: 46, paddingHorizontal: spacing(3), borderWidth: 1, borderColor: colors.border },
  addBtn: { backgroundColor: colors.textPrimary, borderRadius: radii.md, height: 46, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: colors.bg, fontWeight: '700' },
});
