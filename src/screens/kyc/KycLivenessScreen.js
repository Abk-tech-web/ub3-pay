import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as kycService from '../../services/kycService';

export default function KycLivenessScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const onCapture = async () => {
    // TODO(integration): vendor SDK camera flow (Smile ID etc. ship their own UI component)
    setLoading(true);
    try {
      const result = await kycService.submitLiveness('mock://selfie');
      navigation.navigate('KycStatus', { passed: result.passed });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.frame}>
          <View style={styles.faceOutline} />
        </View>
        <Text style={styles.title}>Selfie check</Text>
        <Text style={styles.subtitle}>Center your face in the frame and hold still.</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Capture" onPress={onCapture} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing(6), paddingTop: spacing(10), paddingBottom: spacing(6), alignItems: 'center' },
  frame: {
    width: 220, height: 220, borderRadius: 110, backgroundColor: colors.bgCard,
    borderWidth: 2, borderColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginBottom: spacing(8),
  },
  faceOutline: { width: 140, height: 170, borderRadius: 80, borderWidth: 1.5, borderColor: colors.violetSoft, borderStyle: 'dashed' },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), textAlign: 'center' },
});
