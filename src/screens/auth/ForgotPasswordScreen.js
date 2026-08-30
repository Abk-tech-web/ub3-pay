import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as authService from '../../services/authService';
import { isValidEmail } from '../../utils/validators';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Reset your password</Text>
        {sent ? (
          <Text style={styles.subtitle}>If an account exists for {email}, a reset link is on its way.</Text>
        ) : (
          <>
            <Text style={styles.subtitle}>Enter the email on your account and we'll send a reset link.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <PrimaryButton title="Send reset link" onPress={onSubmit} loading={loading} />
          </>
        )}
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
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(6),
    borderWidth: 1, borderColor: colors.border,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
