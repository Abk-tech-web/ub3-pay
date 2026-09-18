import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';

const SECTIONS = [
  {
    title: 'Crypto',
    rows: [
      { label: 'Deposit limit', value: 'Unlimited' },
      { label: 'Withdraw limit', value: 'Unlimited' },
    ],
  },
  {
    title: 'Naira',
    rows: [
      { label: 'Daily limit', value: '\u20a610,000,000' },
      { label: 'Daily deposit', value: 'Unlimited' },
      { label: 'Daily withdraw', value: '\u20a610,000,000' },
      { label: 'Per transaction', value: '\u20a65,000,000' },
    ],
  },
  {
    title: 'Airtime & Bills',
    rows: [
      { label: 'Airtime daily limit', value: '\u20a6200,000' },
      { label: 'Airtime per transaction', value: '\u20a650,000' },
      { label: 'Other bills daily limit', value: '\u20a61,000,000' },
    ],
  },
];

export default function TransactionLimitsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction Limits</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <View
                  key={row.label}
                  style={[styles.row, i !== section.rows.length - 1 && styles.rowBorder]}
                >
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(5), paddingVertical: spacing(4),
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
  section: { marginBottom: spacing(6) },
  sectionTitle: {
    color: colors.textSecondary, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing(2),
  },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing(4),
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
