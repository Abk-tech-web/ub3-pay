import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as kycService from '../../services/kycService';
import { isValidBvn } from '../../utils/validators';

export default function KycBvnScreen({ navigation }) {
  const [bvn, setBvn] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!isValidBvn(bvn)) return setError('Enter your 11-digit BVN.');
    setLoading(true);
    try {
      const result = await kycService.submitBvn(bvn);
      if (!result.matched) return setError('We couldn\u2019t match that BVN. Double-check and try again.');
      navigation.navigate('KycDocument');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Enter your BVN</Text>
        <Text style={styles.subtitle}>Your Bank Verification Number. We only use it to confirm your identity.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="12345678901"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          maxLength={11}
          value={bvn}
          onChangeText={setBvn}
        />

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Continue" onPress={onSubmit} loading={loading} disabled={bvn.length !== 11} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing(6), paddingTop: spacing(10), paddingBottom: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, borderWidth: 1, borderColor: colors.border, letterSpacing: 2,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
