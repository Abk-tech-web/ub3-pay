import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

export default function OtpVerificationScreen({ route, navigation }) {
  const { email } = route.params ?? {};
  const { setUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const onVerify = async () => {
    setError('');
    setVerifying(true);
    try {
      const result = await authService.verifyOtp(email, code);
      if (!result.verified) {
        setError('That code has expired or is incorrect. Request a new one.');
        return;
      }
      setUser({ uid: 'mock-uid-' + Date.now(), email, kycStatus: 'unverified' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email ?? 'your email'}.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        <PrimaryButton title="Verify" onPress={onVerify} loading={verifying} disabled={code.length !== 6} />

        <Pressable style={{ marginTop: spacing(6), alignSelf: 'center' }}>
          <Text style={styles.link}>Resend code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  otpInput: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 60, marginBottom: spacing(8),
    borderWidth: 1, borderColor: colors.border, fontSize: 24, letterSpacing: 12, textAlign: 'center',
  },
  link: { color: colors.violetSoft, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
