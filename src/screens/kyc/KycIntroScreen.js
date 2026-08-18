import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

const STEPS = [
  { title: 'BVN check', desc: 'Confirms your identity against your bank verification number.' },
  { title: 'Government ID', desc: 'NIN slip, driver\u2019s license, or passport.' },
  { title: 'Selfie check', desc: 'A quick liveness check to match your face to your ID.' },
];

export default function KycIntroScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>
          One-time setup, usually done in under 3 minutes. Required before you can hold
          balances or move money.
        </Text>

        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Start verification" onPress={() => navigation.navigate('KycBvn')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing(6), paddingTop: spacing(10), paddingBottom: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  stepRow: { flexDirection: 'row', marginBottom: spacing(6) },
  stepNum: {
    width: 28, height: 28, borderRadius: radii.pill, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3),
  },
  stepNumText: { color: colors.violetSoft, fontWeight: '700', fontSize: 12 },
  stepTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  stepDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
