import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'https://ub3-pay-backend.onrender.com';

// Real OTP verification: we send a 6-digit code to the user's email via our
// backend/Postmark, they type it in, we verify it against Firestore.
export default function VerifyEmailScreen({ route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { email } = route.params ?? {};
  const { refreshEmailVerified } = useAuth();
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to send code.');
      } else {
        setSent(true);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const onVerify = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Incorrect code.');
      } else {
        await refreshEmailVerified();
        // AuthContext's user.emailVerified flips and RootNavigator/KycNavigator
        // will naturally move them forward.
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          {sent
            ? `Enter the 6-digit code we sent to ${email ?? 'your email'}.`
            : `We'll send a verification code to ${email ?? 'your email'}.`}
        </Text>

        {!sent ? (
          <PrimaryButton title="Send code" onPress={onSend} loading={sending} />
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
            <PrimaryButton title="Verify" onPress={onVerify} loading={checking} />

            <Pressable onPress={onSend} style={{ marginTop: spacing(6), alignSelf: 'center' }}>
              <Text style={styles.link}>Resend code</Text>
            </Pressable>
          </>
        )}

        {error ? <Text style={styles.warn}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  input: {
    borderWidth: 1,
    borderColor: colors.violetSoft,
    borderRadius: 12,
    padding: spacing(4),
    color: colors.textPrimary,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: spacing(4),
  },
  link: { color: colors.violetSoft, fontWeight: '600' },
  warn: { color: colors.warning, fontSize: 13, marginTop: spacing(4) },
});
