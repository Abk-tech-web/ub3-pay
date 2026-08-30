import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import Logo from '../../components/Logo';
import PrimaryButton from '../../components/PrimaryButton';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isStrongPassword } from '../../utils/validators';

function friendlyAuthError(err) {
  const code = err?.code ?? '';
  if (code.includes('email-already-in-use')) return 'An account already exists for that email.';
  if (code.includes('invalid-email')) return 'That email address doesn\u2019t look right.';
  if (code.includes('weak-password')) return 'Choose a stronger password.';
  if (code.includes('network-request-failed')) return 'No internet connection.';
  return 'Could not create your account. Try again.';
}

export default function SignUpScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!isStrongPassword(password)) return setError('Password needs 8+ characters with a letter and a number.');
    try {
      await signUp(email, password);
      // AuthContext's onAuthStateChanged listener signs them in automatically;
      // RootNavigator will route to KycNavigator once that fires. We just
      // need to get them to the "verify your email" screen first.
      navigation.navigate('VerifyEmail', { email });
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <Logo size={26} />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Takes about a minute. Identity verification comes next.</Text>

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
    <PasswordInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" />

          <PrimaryButton title="Create account" onPress={onSubmit} loading={loading} />

          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing(8), alignSelf: 'center' }}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.link}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
