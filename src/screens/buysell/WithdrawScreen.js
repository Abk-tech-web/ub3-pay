import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function WithdrawScreen({ navigation }) {
  const [mode, setMode] = useState('crypto');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Withdraw</Text>
        <View style={styles.pillRow}>
          <Pressable onPress={() => setMode('crypto')} style={[styles.pill, mode === 'crypto' && styles.pillActive]}>
            <Text style={[styles.pillLabel, mode === 'crypto' && styles.pillLabelActive]}>Crypto</Text>
          </Pressable>
          <Pressable onPress={() => setMode('ngn')} style={[styles.pill, mode === 'ngn' && styles.pillActive]}>
            <Text style={[styles.pillLabel, mode === 'ngn' && styles.pillLabelActive]}>Naira</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          {mode === 'crypto'
            ? 'Send crypto to an external wallet — use the Send screen from any asset.'
            : 'Withdraw to a linked bank account.'}
        </Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton
          title={mode === 'crypto' ? 'Choose an asset to send' : 'Withdraw to bank'}
            onPress={() => (mode === 'crypto' ? navigation.navigate('Send') : Alert.alert('Coming soon', 'Bank withdrawal is not available yet. We are working on it.'))}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(5) },
  pillRow: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(5) },
  pill: { paddingVertical: spacing(2), paddingHorizontal: spacing(4), borderRadius: radii.pill, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  pillLabel: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  pillLabelActive: { color: colors.bg },
  subtitle: { color: colors.textSecondary, fontSize: 14 },
});
