import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, Image, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import FloatingInput from '../../components/FloatingInput';
import { fetchNigerianBanks } from '../../data/nigerianBanksApi';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost } from '../../services/api';

export default function VerifyBvnScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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
      navigation.goBack();
    } catch (err) {
      setSubmitError(err.message || 'Verification failed. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Verify BVN</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing(10) }} enableOnAndroid={true} extraScrollHeight={20} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          We use your Bank Verification Number to confirm your identity before enabling withdrawals, airtime, data, and deposits.
        </Text>

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

        <Text style={styles.label}>First Name</Text>
        <FloatingInput label="First Name" value={firstName} onChangeText={setFirstName} />

        <Text style={[styles.label, { marginTop: spacing(5) }]}>Last Name</Text>
        <FloatingInput label="Last Name" value={lastName} onChangeText={setLastName} />

        <Text style={[styles.label, { marginTop: spacing(5) }]}>BVN</Text>
        <FloatingInput
          label="11-digit BVN"
          value={bvn}
          onChangeText={setBvn}
          keyboardType="number-pad"
          maxLength={11}
        />

        <Text style={[styles.label, { marginTop: spacing(5) }]}>Bank</Text>
        <Pressable style={styles.selectField} onPress={() => setPickerVisible(true)}>
          {selectedBank?.logo ? (
            <Image source={{ uri: selectedBank.logo }} style={styles.selectedLogo} />
          ) : null}
          <Text style={[styles.selectFieldText, !selectedBank && { color: colors.textSecondary }]}>
            {selectedBank ? selectedBank.name : 'Select your bank'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
        </Pressable>

        <Text style={[styles.label, { marginTop: spacing(5) }]}>Account Number</Text>
        <FloatingInput
          label="Account Number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          maxLength={10}
        />

        {resolving && (
          <View style={styles.resolvedCard}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={[styles.resolvedText, { marginLeft: spacing(2) }]}>Verifying account...</Text>
          </View>
        )}
        {!resolving && resolveError ? (
          <Text style={{ color: '#D32F2F', marginTop: spacing(2) }}>{resolveError}</Text>
        ) : null}
        {!resolving && resolvedName && (
          <View style={styles.resolvedCard}>
            <Ionicons name="checkmark-circle" size={18} color="#008751" />
            <Text style={styles.resolvedText}>{resolvedName}</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <PrimaryButton
          title="Verify"
          onPress={onSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
      </KeyboardAwareScrollView>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Bank</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {loadingBanks ? (
            <ActivityIndicator color="#008751" style={{ marginTop: spacing(6) }} />
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code + item.slug}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.bankRow}
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
                </Pressable>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
    paddingBottom: spacing(3),
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: spacing(6), paddingTop: spacing(2), paddingBottom: spacing(6) },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing(5) },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: spacing(2) },
  error: { color: '#D32F2F', marginBottom: spacing(4) },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
  },
  selectedLogo: { width: 24, height: 24, borderRadius: 12, marginRight: spacing(2) },
  selectFieldText: { color: colors.textPrimary, fontSize: 15 },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    padding: spacing(3),
    marginTop: spacing(3),
  },
  resolvedText: { color: colors.textPrimary, fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing(5),
    maxHeight: '75%',
  },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: spacing(3) },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    color: colors.textPrimary,
    marginBottom: spacing(3),
  },
  bankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3) },
  bankLogo: { width: 28, height: 28, borderRadius: 14, marginRight: spacing(3) },
  bankLogoFallback: {
    width: 28, height: 28, borderRadius: 14, marginRight: spacing(3),
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  bankRowText: { color: colors.textPrimary, fontSize: 15 },
});
