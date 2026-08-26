import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function WithdrawScreen({ navigation }) {
  const [uid, setUid] = useState('');

  const onSendToUid = () => {
    Alert.alert('Coming soon', 'Sending to a UB3 Pay UID is not available yet.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Send to UB3 Pay user</Text>
        <Text style={styles.sectionSubtitle}>Optional — send directly by UID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter UB3 ID"
          placeholderTextColor={colors.textSecondary}
          value={uid}
          onChangeText={setUid}
          autoCapitalize="none"
        />
        <PrimaryButton
          title="Send to UID"
          onPress={onSendToUid}
          disabled={uid.trim().length === 0}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Bank Withdrawal</Text>
        <Text style={styles.sectionSubtitle}>Optional — withdraw to a Nigerian bank account</Text>
        <Pressable
          style={styles.bankRow}
          onPress={() => navigation.navigate('BankAccount')}
        >
          <View style={styles.bankRowIcon}>
            <Ionicons name="business-outline" size={20} color="#008751" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bankRowTitle}>Withdraw to Bank Account</Text>
            <Text style={styles.bankRowSubtitle}>Choose a bank and account number</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing(1) },
  sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing(3) },
  input: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    marginBottom: spacing(3),
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing(6),
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    gap: spacing(3),
  },
  bankRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankRowTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  bankRowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
