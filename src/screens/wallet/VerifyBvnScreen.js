import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, Image,
  KeyboardAvoidingView, Platform, Animated, ScrollView,
} from 'react-native';
import ActivityIndicator from '../../components/UB3Loader';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { fetchNigerianBanks } from '../../data/nigerianBanksApi';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost } from '../../services/api';
import ProcessingOverlay from '../../components/ProcessingOverlay';

const SHADOW = '#2a1260';

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

export default function VerifyBvnScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user, refreshBvnStatus } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bvn, setBvn] = useState('');

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');

  const [resolvedName, setResolvedName] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [phase, setPhase] = useState(null);

  const pop = useRef(new Animated.Value(0.6)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    Animated.timing(cardFade, { toValue: 1, duration: 450, delay: 150, useNativeDriver: true }).start();
  }, []);

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

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    bvn.length === 11 &&
    selectedBank &&
    accountNumber.length === 10 &&
    resolvedName &&
    !submitting;

  const onSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    setPhase('processing');
    try {
      await apiPost('/verify-bvn', {
        uid: user.uid,
        email: user.email,
        bvn,
        bank_code: selectedBank.code,
        account_number: accountNumber,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      await refreshBvnStatus();
      setPhase('success');
      setTimeout(() => {
        setPhase(null);
        navigation.goBack();
      }, 1500);
    } catch (err) {
      setPhase(null);
      setSubmitError(err.message || 'Verification failed. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.heroTitle}>Verify BVN</Text>
            <View style={{ width: 38 }} />
          </View>
          <Animated.View style={[styles.shieldCircle, { transform: [{ scale: pop }] }]}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.heroSub}>
            We use your Bank Verification Number to confirm your identity before enabling withdrawals, airtime, data, and deposits.
          </Text>
        </View>

        <Animated.View style={[styles.card, { opacity: cardFade }]}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor={colors.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor={colors.textSecondary}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>BVN</Text>
          <TextInput
            style={styles.input}
            placeholder="11-digit BVN"
            placeholderTextColor={colors.textSecondary}
            value={bvn}
            onChangeText={(t) => setBvn(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={11}
          />

          <Text style={styles.label}>Bank</Text>
          <Pressable style={styles.selectField} onPress={() => setPickerVisible(true)}>
            {selectedBank && selectedBank.logo ? (
              <Image source={{ uri: selectedBank.logo }} style={styles.selectedLogo} />
            ) : null}
            <Text style={[styles.selectFieldText, !selectedBank && { color: colors.textSecondary }]} numberOfLines={1}>
              {selectedBank ? selectedBank.name : 'Select your bank'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </Pressable>

          <Text style={styles.label}>Account number</Text>
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
            <View style={styles.resolvedCard}>
              <ActivityIndicator size="small" color={colors.violet} />
              <Text style={[styles.resolvedText, { color: colors.textSecondary }]}>Verifying account...</Text>
            </View>
          ) : null}
          {!resolving && resolveError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{resolveError}</Text>
            </View>
          ) : null}
          {!resolving && resolvedName ? (
            <View style={[styles.resolvedCard, styles.resolvedOk]}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              <Text style={[styles.resolvedText, { fontWeight: '700' }]} numberOfLines={2}>{resolvedName}</Text>
            </View>
          ) : null}

          {submitError ? (
            <View style={[styles.errorBox, { marginTop: 18 }]}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [styles.bigBtn, !canSubmit && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.bigBtnText}>Verify</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={closePicker}
      >
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
                    on={!!selectedBank && selectedBank.code === item.code && selectedBank.name === item.name}
                    onPress={() => pickBank(item)}
                  />
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ProcessingOverlay
        visible={phase !== null}
        phase={phase}
        title={phase === 'success' ? 'BVN verified' : 'Verifying your BVN'}
        subtitle={phase === 'success' ? 'Your account is ready to use' : 'This can take a few seconds'}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
    overflow: 'hidden', alignItems: 'center',
  },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  shieldCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 30 },
  card: {
    marginTop: -40, marginHorizontal: 20, backgroundColor: colors.bgCard, borderRadius: 28, padding: 22,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 12,
  },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: colors.bg, color: colors.textPrimary, borderRadius: 16, paddingHorizontal: 16, height: 52,
    marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  selectField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16,
    height: 52, marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  selectedLogo: { width: 26, height: 26, borderRadius: 13, marginRight: 10 },
  selectFieldText: { color: colors.textPrimary, fontSize: 15, flexShrink: 1 },
  resolvedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 16, padding: 14, marginTop: 2,
  },
  resolvedOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  resolvedText: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 2,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginTop: 22,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
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
