import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, Image,
  Animated,
} from 'react-native';
import ActivityIndicator from '../../components/UB3Loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import FloatingInput from '../../components/FloatingInput';
import { fetchNigerianBanks } from '../../data/nigerianBanksApi';
import { apiGet } from '../../services/api';

function Reveal({ delay = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

export default function BankAccountScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');

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

  const [resolvedName, setResolvedName] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

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

  const canContinue = selectedBank && accountNumber.length === 10 && resolvedName;

  const onContinue = () => {
    navigation.navigate('WithdrawAmount', {
      bank: selectedBank,
      accountNumber,
      accountName: resolvedName,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Bank Account</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.body}>
        <Reveal delay={0}>
          <Text style={styles.label}>Bank</Text>
          <Pressable style={styles.selectField} onPress={() => setPickerVisible(true)}>
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
        </Reveal>

        <Reveal delay={90}>
          <Text style={[styles.label, { marginTop: spacing(5) }]}>Account Number</Text>
          <FloatingInput
            label="Account Number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            maxLength={10}
          />

          {resolving && (
            <View style={styles.verifyCard}>
              <ActivityIndicator size="small" color={colors.violet} />
              <Text style={styles.verifyText}>Verifying account...</Text>
            </View>
          )}
          {!resolving && resolveError ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{resolveError}</Text>
            </View>
          ) : null}
          {!resolving && resolvedName && (
            <View style={styles.resolvedCard}>
              <View style={styles.tick}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.resolvedText}>{resolvedName}</Text>
            </View>
          )}
        </Reveal>

        <View style={{ flex: 1 }} />

        <PrimaryButton title="Continue" onPress={onContinue} disabled={!canContinue} />
      </View>

      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Select Bank</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search banks"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loadingBanks ? (
            <ActivityIndicator color={colors.violet} style={{ marginTop: spacing(6) }} />
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code + item.slug}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing(6) }}
              renderItem={({ item }) => {
                const active = selectedBank && selectedBank.code === item.code && selectedBank.slug === item.slug;
                return (
                  <Pressable
                    style={[styles.bankRow, active && styles.bankRowActive]}
                    onPress={() => {
                      setSelectedBank(item);
                      setPickerVisible(false);
                      setSearch('');
                    }}
                  >
                    {item.logo ? (
                      <Image source={{ uri: item.logo }} style={styles.bankLogo} />
                    ) : (
                      <View style={styles.bankLogoFallback}>
                        <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.bankRowText}>{item.name}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={colors.violet} /> : null}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(4), paddingVertical: spacing(3),
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(3) },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing(2) },
  selectField: {
    backgroundColor: colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing(4), height: 62, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#2a1260', shadowOpacity: 0.2, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  selectedLogo: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  selectedLogoFallback: {
    width: 32, height: 32, borderRadius: 16, marginRight: 12,
    backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
  },
  selectFieldText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  verifyCard: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing(3), padding: spacing(4),
    borderRadius: 18, backgroundColor: colors.violetSoft,
  },
  verifyText: { fontSize: 14, fontWeight: '600', color: colors.violet, marginLeft: spacing(2) },
  errorCard: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing(3), padding: spacing(4),
    borderRadius: 18, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.danger,
  },
  errorText: { fontSize: 14, color: colors.danger, marginLeft: spacing(2), flexShrink: 1 },
  resolvedCard: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing(3), padding: spacing(4),
    borderRadius: 18, backgroundColor: '#e6f4ea', borderWidth: 1, borderColor: '#bfe3cb',
    shadowColor: '#0a5c2e', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  tick: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#16a34a',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing(3),
  },
  resolvedText: { fontSize: 15, fontWeight: '800', color: '#0a5c2e', flexShrink: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,4,30,0.7)' },
  modalSheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    height: '72%', padding: spacing(5),
  },
  handle: {
    width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing(4),
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing(3) },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: 18, paddingHorizontal: spacing(4), height: 48, marginBottom: spacing(3),
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, marginLeft: spacing(2) },
  bankRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: 18, padding: spacing(3), marginBottom: spacing(2),
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  bankRowActive: { borderColor: colors.violet, borderWidth: 1.5 },
  bankLogo: { width: 36, height: 36, borderRadius: 18, marginRight: spacing(3) },
  bankLogoFallback: {
    width: 36, height: 36, borderRadius: 18, marginRight: spacing(3),
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  bankRowText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
});
