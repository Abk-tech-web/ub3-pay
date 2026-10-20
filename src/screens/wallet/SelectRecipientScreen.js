import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Alert, TextInput, Modal, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { truncateAddress } from '../../utils/formatters';
import { getAvatarColor } from '../../utils/avatarColor';
import UB3Loader from '../../components/UB3Loader';
import { getFavourites, addFavourite, removeFavourite, getRecents } from '../../services/favouritesService';

const SHADOW = '#2a1260';
const idText = (id) => (/^[0-9]{8}$/.test(id) ? id.slice(0, 4) + ' ' + id.slice(4) : '@' + id);

function RecipientCard({ item, index, tab, styles, colors, onPick, onRemove }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 280, delay: Math.min(index, 8) * 40, useNativeDriver: true }).start();
  }, []);
  const isId = !!item.ub3Id;
  const title = isId ? (item.label || idText(item.ub3Id)) : (item.label || truncateAddress(item.address));
  const sub = isId
    ? 'UB3 ID ' + idText(item.ub3Id)
    : (item.label ? truncateAddress(item.address) : (item.symbol || ''));
  const seed = String(item.ub3Id || item.address || item.label || 'x');
  const letter = String(item.label || item.ub3Id || item.address || '?').slice(0, 1).toUpperCase();
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]} onPress={() => onPick(item.ub3Id || item.address)}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(seed) }]}>
          <Text style={styles.avatarText}>{letter}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel} numberOfLines={1}>{title}</Text>
          <View style={styles.subRow}>
            {isId ? (
              <View style={styles.idTag}><Text style={styles.idTagText}>UB3 ID</Text></View>
            ) : null}
            <Text style={styles.rowSub} numberOfLines={1}>{isId ? idText(item.ub3Id) : sub}</Text>
          </View>
        </View>
        {tab === 'favourites' ? (
          <Pressable onPress={() => onRemove(item.id)} hitSlop={10} style={styles.trashBtn}>
            <Feather name="trash-2" size={16} color={colors.danger} />
          </Pressable>
        ) : (
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function SelectRecipientScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { targetRoute = 'SendAmount', chainId, symbol } = route.params ?? {};

  const [tab, setTab] = useState('favourites');
  const [favourites, setFavourites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([getFavourites(), getRecents()]);
      setFavourites(f);
      setRecents(r);
    } catch (e) {
      // silent - list just stays empty
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pick = (address) => {
    navigation.navigate(targetRoute, { chainId, symbol, selectedAddress: address });
  };

  const openSheet = () => { setFormErr(''); setSheetOpen(true); };

  const onAddFavourite = async () => {
    if (!newAddress.trim() || !newLabel.trim()) {
      setFormErr('Enter a label and an address.');
      return;
    }
    setSaving(true);
    setFormErr('');
    try {
      const raw = newAddress.trim();
      const idv = raw.replace(/^@/, '').toLowerCase();
      if (/^[a-z0-9_]{3,20}$/.test(idv)) {
        await addFavourite(newLabel.trim(), '', idv);
      } else {
        await addFavourite(newLabel.trim(), raw);
      }
      setNewAddress('');
      setNewLabel('');
      setSheetOpen(false);
      load();
    } catch (e) {
      setFormErr(e.message || 'Could not save favourite.');
    }
    setSaving(false);
  };

  const onRemoveFavourite = (id) => {
    Alert.alert('Remove favourite', 'Remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try { await removeFavourite(id); load(); } catch (e) {}
        },
      },
    ]);
  };

  const all = tab === 'favourites' ? favourites : recents;
  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((it) => {
      const hay = [it.label, it.address, it.ub3Id, it.symbol].filter(Boolean).join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }, [all, search]);

  const renderEmpty = () => {
    if (!loaded) {
      return (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <UB3Loader size={96} color={colors.violet} />
        </View>
      );
    }
    if (search.trim() && all.length > 0) {
      return (
        <View style={styles.emptyBox}>
          <Feather name="search" size={30} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptySub}>Try a different name, UB3 ID or address.</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyCircle}>
          <Feather name={tab === 'favourites' ? 'star' : 'clock'} size={28} color={colors.violet} />
        </View>
        <Text style={styles.emptyTitle}>{tab === 'favourites' ? 'No saved recipients yet' : 'No recent sends yet'}</Text>
        <Text style={styles.emptySub}>
          {tab === 'favourites' ? 'Save a wallet address or UB3 ID to send to it in one tap.' : 'People you send to will show up here.'}
        </Text>
        {tab === 'favourites' ? (
          <Pressable style={styles.emptyBtn} onPress={openSheet}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add recipient</Text>
          </Pressable>
        ) : null}
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
            <Text style={styles.heroTitle}>Select Recipient</Text>
            <Text style={styles.heroSub}>Choose who to send to</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.segment}>
          {[['favourites', 'Favourites', 'star'], ['recents', 'Recents', 'clock']].map(([k, label, icon]) => {
            const on = tab === k;
            return (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.segBtn, on && styles.segBtnOn]}>
                <Feather name={icon} size={14} color={on ? '#fff' : colors.textSecondary} />
                <Text style={[styles.segText, on && { color: '#fff' }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.searchWrap}>
          <Feather name="search" size={17} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, UB3 ID or address"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Feather name="x-circle" size={17} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={data}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, idx) => item.id || (item.address || item.ub3Id || '') + idx}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 110 }}
        ListEmptyComponent={renderEmpty()}
        renderItem={({ item, index }) => (
          <RecipientCard
            item={item}
            index={index}
            tab={tab}
            styles={styles}
            colors={colors}
            onPick={pick}
            onRemove={onRemoveFavourite}
          />
        )}
      />

      {tab === 'favourites' ? (
        <Pressable
          onPress={openSheet}
          style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 22 }, pressed && { opacity: 0.85 }]}
        >
          <Feather name="plus" size={26} color="#fff" />
        </Pressable>
      ) : null}

      <Modal visible={sheetOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Save a recipient</Text>
            <Text style={styles.sheetSub}>Add a wallet address or a UB3 ID so you can pick it in one tap.</Text>

            <Text style={styles.label}>Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. My CEX wallet"
              placeholderTextColor={colors.textSecondary}
              value={newLabel}
              onChangeText={setNewLabel}
            />
            <Text style={styles.label}>Address or UB3 ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Wallet address or UB3 ID"
              placeholderTextColor={colors.textSecondary}
              value={newAddress}
              onChangeText={setNewAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {formErr ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{formErr}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.bigBtn, pressed && { opacity: 0.85 }]}
              onPress={onAddFavourite}
              disabled={saving}
            >
              {saving ? <UB3Loader size={30} color="#fff" /> : <Text style={styles.bigBtnText}>Save recipient</Text>}
            </Pressable>
            <View style={{ height: 14 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 54, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  toolbar: {
    marginTop: -30, marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.bgCard, borderRadius: 24, padding: 14,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 10,
  },
  segment: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 18, padding: 4, marginBottom: 12 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 14 },
  segBtnOn: {
    backgroundColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  segText: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, height: 48 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 22, padding: 14, marginBottom: 12,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  idTag: { backgroundColor: 'rgba(124,58,237,0.16)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  idTagText: { color: colors.violet, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  rowSub: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
  trashBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 24 },
  emptyCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.violet, borderRadius: 22, height: 44, paddingHorizontal: 22, marginTop: 18,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  fab: {
    position: 'absolute', right: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,45,0.62)' },
  sheet: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 12,
    shadowColor: SHADOW, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -8 }, elevation: 20,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14 },
  sheetTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  sheetSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 19 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: colors.bg, color: colors.textPrimary, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14, paddingHorizontal: 12,
    paddingVertical: 10, marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
