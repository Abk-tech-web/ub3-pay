import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
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

function Reveal({ delay = 0, children, style, slide = true }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={[style, slide ? { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] } : { opacity: v }]}
    >
      {children}
    </Animated.View>
  );
}

function EmailField({ styles, colors, value, onChangeText }) {
  return (
    <TextInput
      style={styles.plainInput}
      placeholder="you@example.com"
      placeholderTextColor={colors.textSecondary}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

export default function SignInScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

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
    <View style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { paddingTop: insets.top + 36 }]}>
            <View style={styles.heroGlow} />
            <View style={styles.heroGlow2} />
            <Animated.View style={[styles.logoPlate, { transform: [{ scale: pop }] }]}>
              <Image source={require('../../../assets/icon.png')} style={styles.logoImg} />
            </Animated.View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your wallet.</Text>
          </View>

          <Reveal delay={120} style={styles.card} slide={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <EmailField styles={styles} colors={colors} value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Password</Text>
            <PasswordInput value={password} onChangeText={setPassword} placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'} />

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            <PrimaryButton title="Sign in" onPress={onSubmit} loading={loading} />
          </Reveal>

          <Reveal delay={240} style={{ alignItems: 'center' }}>
            <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.footer}>
              <Text style={styles.footerText}>
                New here? <Text style={styles.link}>Create an account</Text>
              </Text>
            </Pressable>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 70, alignItems: 'center', overflow: 'hidden',
    borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
  },
  heroGlow: {
    position: 'absolute', top: -70, right: -50, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroGlow2: {
    position: 'absolute', bottom: -60, left: -60, width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(139,92,246,0.35)',
  },
  logoPlate: {
    width: 84, height: 84, borderRadius: 26, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    shadowColor: '#1a0b3d', shadowOpacity: 0.45, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  logoImg: { width: 62, height: 62, borderRadius: 18 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 15, marginTop: 6 },
  card: {
    marginTop: -40, marginHorizontal: 20, backgroundColor: colors.bgCard, borderRadius: 28,
    borderWidth: 1, borderColor: colors.border, padding: 22,
    shadowColor: '#2a1260', shadowOpacity: 0.25, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginBottom: 14,
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: 18, height: 54, paddingHorizontal: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputWrapFocused: {
    borderColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, marginLeft: 10, height: '100%' },
  plainInput: { backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  forgot: { alignSelf: 'flex-end', marginTop: 4, marginBottom: 22 },
  link: { color: colors.violet, fontWeight: '700' },
  footer: { marginTop: 26 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
});
