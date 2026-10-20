import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, Image, Animated, Easing,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ActivityIndicator from '../../components/UB3Loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { fetchNigerianBanks } from '../../data/nigerianBanksApi';
import { apiGet } from '../../services/api';

const SHADOW = '#2a1260';

function Reveal({ index = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1, duration: 400, delay: Math.min(index, 8) * 90, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function BankRow({ item, index, on, styles, colors, onPress }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 260, delay: Math.min(index, 8) * 35, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      <Pressable style={({ pressed }) => [styles.bankRow, on && styles.bankRowOn, pressed && { opacity: 0.85 }]} onPress={onPress}>
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.bankLogo} />
        ) : (
          <View style={styles.bankLogoFallback}>
            <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
          </View>
        )}
        <Text style={styles.bankRowText} numberOfLines={1}>{item.name}</Text>
        {on ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.violet} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function BankAccountScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    fetchNigerianBanks().then((list) => {
      setBanks(list);
      setLoadingBanks(false);
    });
  }, []);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    const q = search.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [search, banks]);

  const popular = useMemo(() => {
    const keys = [['access', 'Access'], ['guaranty', 'GTBank'], ['zenith', 'Zenith'], ['first bank', 'First Bank'], ['united bank', 'UBA'], ['opay', 'OPay'], ['kuda', 'Kuda'], ['palmpay', 'PalmPay'], ['moniepoint', 'Moniepoint']];
    const out = [];
    keys.forEach(([k, label]) => {
      const b = banks.find((x) => x.name.toLowerCase().includes(k));
      if (b && !out.some((o) => o.bank.code === b.code && o.bank.name === b.name)) out.push({ label, bank: b });
    });
    return out;
  }, [banks]);

  const closePicker = () => { setPickerVisible(false); setSearch(''); };
  const pickBank = (item) => { setSelectedBank(item); setPickerVisible(false); setSearch(''); };

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      let cancelled = false;
      setResolving(true);
      setResolveError('');
      setResolvedName(null);
      apiGet('/bank/resolve?account_number=' + accountNumber + '&bank_code=' + selectedBank.code)
        .then((data) => { if (!cancelled) setResolvedName(data.account_name); })
        .catch((err) => { if (!cancelled) setResolveError(err.message || 'Could not verify account'); })
        .finally(() => { if (!cancelled) setResolving(false); });
      return () => { cancelled = true; };
    }
    setResolvedName(null);
    setResolveError('');
  }, [accountNumber, selectedBank]);

  const canContinue = !!(selectedBank && accountNumber.length === 10 && resolvedName);

  const onContinue = () => {
    if (!canContinue) return;
    navigation.navigate('WithdrawAmount', {
      bank: selectedBank,
      accountNumber,
      accountName: resolvedName,
    });
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Bank Account</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroSub}>Choose your bank and enter the account number to withdraw to.</Text>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <Text style={styles.label}>Bank</Text>
            <Pressable style={({ pressed }) => [styles.selectField, pressed && { opacity: 0.88 }]} onPress={() => setPickerVisible(true)}>
              {selectedBank && selectedBank.logo ? (
                <Image source={{ uri: selectedBank.logo }} style={styles.selectedLogo} />
              ) : (
                <View style={styles.selectedLogoFallback}>
                  <Ionicons name="business-outline" size={16} color="#fff" />
                </View>
              )}
              <Text style={[styles.selectFieldText, !selectedBank && { color: colors.textSecondary }]} numberOfLines={1}>
                {selectedBank ? selectedBank.name : 'Select your bank'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
            </Pressable>

            <Text style={[styles.label, { marginTop: 16 }]}>Account number</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit account number"
              placeholderTextColor={colors.textSecondary}
              value={accountNumber}
              onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={10}
            />

            {resolving ? (
              <View style={styles.verifyCard}>
                <ActivityIndicator size={28} color={colors.violet} />
                <Text style={styles.verifyText}>Verifying account...</Text>
              </View>
            ) : null}
            {!resolving && resolveError ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{resolveError}</Text>
              </View>
            ) : null}
            {!resolving && resolvedName ? (
              <View style={styles.resolvedCard}>
                <View style={styles.tick}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resolvedLabel}>ACCOUNT NAME</Text>
                  <Text style={styles.resolvedText} numberOfLines={2}>{resolvedName}</Text>
                </View>
              </View>
            ) : null}
          </Reveal>

          <Reveal index={1} style={styles.note}>
            <Ionicons name="shield-checkmark" size={16} color={colors.violet} />
            <Text style={styles.noteText}>We check the account name with your bank before you continue, so your money goes to the right person.</Text>
          </Reveal>

          <Pressable
            onPress={onContinue}
            disabled={!canContinue}
            style={({ pressed }) => [styles.bigBtn, !canContinue && { opacity: 0.45 }, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.bigBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <Modal visible={pickerVisible} animationType="slide" transparent statusBarTranslucent onRequestClose={closePicker}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalBackdrop} onPress={closePicker} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <View style={styles.sheetBadge}>
                <Ionicons name="business" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select your bank</Text>
                <Text style={styles.modalSub}>{loadingBanks ? 'Loading banks...' : filteredBanks.length + ' banks'}</Text>
              </View>
              <Pressable onPress={closePicker} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search banks"
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {!search.trim() && popular.length > 0 && !loadingBanks ? (
              <View>
                <Text style={styles.popTitle}>POPULAR</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ flexGrow: 0, marginBottom: 14 }}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {popular.map((p) => (
                    <Pressable key={p.bank.code + p.bank.name} style={styles.popChip} onPress={() => pickBank(p.bank)}>
                      {p.bank.logo ? <Image source={{ uri: p.bank.logo }} style={styles.popLogo} /> : null}
                      <Text style={styles.popText}>{p.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {loadingBanks ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <ActivityIndicator size={72} color={colors.violet} />
              </View>
            ) : (
              <FlatList
                style={{ flex: 1 }}
                data={filteredBanks}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
                keyExtractor={(item) => item.code + item.slug}
                ListEmptyComponent={(
                  <View style={styles.emptyBox}>
                    <Ionicons name="search-outline" size={34} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>No banks found</Text>
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <BankRow
                    item={item}
                    index={index}
                    styles={styles}
                    colors={colors}
                    on={!!selectedBank && selectedBank.code === item.code && selectedBank.slug === item.slug}
                    onPress={() => pickBank(item)}
                  />
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden', alignItems: 'center' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 34 },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  selectField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 14, height: 56,
    borderWidth: 1, borderColor: colors.border,
  },
  selectedLogo: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  selectedLogoFallback: { width: 32, height: 32, borderRadius: 16, marginRight: 12, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  selectFieldText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  input: {
    backgroundColor: colors.bg, color: colors.textPrimary, borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 16, fontWeight: '600',
    letterSpacing: 1, borderWidth: 1, borderColor: colors.border,
  },
  verifyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: 'rgba(124,58,237,0.12)' },
  verifyText: { fontSize: 14, fontWeight: '700', color: colors.violet },
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.12)',
  },
  errorText: { fontSize: 13, color: colors.danger, flex: 1 },
  resolvedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  tick: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  resolvedLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: '#16a34a' },
  resolvedText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  note: { flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginTop: 16, alignItems: 'flex-start' },
  noteText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  bigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 58, borderRadius: 20, backgroundColor: colors.violet, marginTop: 20,
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  bigBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,10,45,0.62)' },
  modalSheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 18, paddingTop: 12, height: '84%',
    shadowColor: SHADOW, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -8 }, elevation: 20,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sheetBadge: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  modalSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: 18, paddingHorizontal: 14,
    height: 50, marginBottom: 14, borderWidth: 1, borderColor: colors.border,
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, height: 50 },
  popTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  popChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 21, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  popLogo: { width: 24, height: 24, borderRadius: 12 },
  popText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  bankRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 20, padding: 12, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: SHADOW, shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  bankRowOn: { borderColor: colors.violet, backgroundColor: 'rgba(124,58,237,0.10)' },
  bankLogo: { width: 42, height: 42, borderRadius: 21, marginRight: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF' },
  bankLogoFallback: {
    width: 42, height: 42, borderRadius: 21, marginRight: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  bankRowText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
