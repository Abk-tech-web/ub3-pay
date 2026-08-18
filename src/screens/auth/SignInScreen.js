import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validators';

// Maps Firebase Auth error codes to copy people can actually act on,
// instead of showing "Firebase: Error (auth/user-not-found)." verbatim.
function friendlyAuthError(err) {
  const code = err?.code ?? '';
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again in a few minutes.';
  if (code.includes('network-request-failed')) return 'No internet connection.';
  return 'Could not sign in. Check your details and try again.';
}

export default function SignInScreen({ navigation }) {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (password.length < 1) return setError('Enter your password.');
    try {
      await signIn(email, password);
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <Text style={styles.brand}>Ub3 Pay</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your wallet.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
    <PasswordInput value={password} onChangeText={setPassword} placeholder="••••••••" />

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: spacing(6) }}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>

          <PrimaryButton title="Sign in" onPress={onSubmit} loading={loading} />

          <Pressable onPress={() => navigation.navigate('SignUp')} style={{ marginTop: spacing(8), alignSelf: 'center' }}>
            <Text style={styles.footerText}>
              New here? <Text style={styles.link}>Create an account</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(6) },
  brand: { color: colors.violetSoft, fontSize: 14, fontWeight: '700', letterSpacing: 2, marginBottom: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(4),
    borderWidth: 1, borderColor: colors.border,
  },
  link: { color: colors.violetSoft, fontWeight: '600' },
  footerText: { color: colors.textSecondary, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
