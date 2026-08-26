import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import FloatingInput from '../../components/FloatingInput';
import { fetchNigerianBanks } from '../../data/nigerianBanksApi';

const MOCK_FIRST_NAMES = ['Adaeze', 'Chinedu', 'Ifeoma', 'Tunde', 'Amaka', 'Bello'];
const MOCK_LAST_NAMES = ['Okafor', 'Mohammed', 'Adeyemi', 'Nwosu', 'Balogun', 'Eze'];

function mockResolveName(accountNumber) {
  const seed = accountNumber
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const first = MOCK_FIRST_NAMES[seed % MOCK_FIRST_NAMES.length];
  const last = MOCK_LAST_NAMES[(seed * 7) % MOCK_LAST_NAMES.length];
  return `${first} ${last}`;
}

export default function BankAccountScreen({ navigation }) {
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

  const resolvedName = useMemo(() => {
    if (accountNumber.length === 10 && selectedBank) {
      return mockResolveName(accountNumber);
    }
    return null;
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
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Bank Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Bank</Text>
        <Pressable
          style={styles.selectField}
          onPress={() => setPickerVisible(true)}
        >
          {selectedBank?.logo ? (
            <Image source={{ uri: selectedBank.logo }} style={styles.selectedLogo} />
          ) : null}
          <Text
            style={[
              styles.selectFieldText,
              !selectedBank && { color: colors.textSecondary },
            ]}
          >
            {selectedBank ? selectedBank.name : 'Select your bank'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
        </Pressable>

        <Text style={[styles.label, { marginTop: spacing(5) }]}>
          Account Number
        </Text>
        <FloatingInput
          label="Account Number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          maxLength={10}
        />

        {resolvedName && (
          <View style={styles.resolvedCard}>
            <Ionicons name="checkmark-circle" size={18} color="#008751" />
            <Text style={styles.resolvedText}>{resolvedName}</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <PrimaryButton
          title="Continue"
          onPress={onContinue}
          disabled={!canContinue}
        />
      </View>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerVisible(false)}
        />
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(2) },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing(2) },
  selectField: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(4),
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  selectedLogo: { width: 24, height: 24, borderRadius: 12 },
  selectFieldText: { fontSize: 15, color: colors.textPrimary },
  input: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(3),
    padding: spacing(3),
    borderRadius: radii.md,
    backgroundColor: '#e6f4ea',
  },
  resolvedText: { fontSize: 15, fontWeight: '600', color: '#008751' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    height: '70%',
    padding: spacing(5),
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing(3),
  },
  searchInput: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    height: 44,
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankLogo: { width: 32, height: 32, borderRadius: 16 },
  bankLogoFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankRowText: { fontSize: 15, color: colors.textPrimary, flexShrink: 1 },
});
