import React, { useState, useRef, useEffect } from 'react';
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
import { isValidEmail, isStrongPassword } from '../../utils/validators';
import { apiGet, apiPost } from '../../services/api';

function friendlyAuthError(err) {
  const code = err?.code ?? '';
  if (code.includes('email-already-in-use')) return 'An account already exists for that email.';
  if (code.includes('invalid-email')) return 'That email address doesn\u2019t look right.';
  if (code.includes('weak-password')) return 'Choose a stronger password.';
  if (code.includes('network-request-failed')) return 'No internet connection.';
  return 'Could not create your account. Try again.';
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

export default function SignUpScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const [refState, setRefState] = useState('');
  const refLatest = useRef('');
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  const onRefChange = (t) => {
    const v = t.toUpperCase().replace(/\s/g, '');
    refLatest.current = v;
    setRefCode(v);
    setRefState('');
    if (v.length >= 9) {
      setRefState('checking');
      apiGet('/referral/check/' + encodeURIComponent(v))
        .then((r) => { if (refLatest.current === v) setRefState(r && r.valid ? 'ok' : 'bad'); })
        .catch(() => { if (refLatest.current === v) setRefState(''); });
    }
  };

  const onSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!isStrongPassword(password)) return setError('Password needs 8+ characters with a letter and a number.');
    if (refCode.length > 0 && refState === 'bad') return setError('That referral code is not valid. Fix it or clear the field.');
    try {
      await signUp(email, password);
      if (refCode.length > 0) {
        try { await apiPost('/referral/apply', { code: refCode }); } catch (e) {}
      }
      // AuthContext's onAuthStateChanged listener signs them in automatically;
      // RootNavigator will route to the main app once that fires. We just
      // need to get them to the "verify your email" screen first.
      navigation.navigate('VerifyEmail', { email });
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
          <View style={[styles.hero, { paddingTop: insets.top + 30 }]}>
            <View style={styles.heroGlow} />
            <View style={styles.heroGlow2} />
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ position: 'absolute', left: 16, top: insets.top + 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 10 }}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Animated.View style={[styles.logoPlate, { transform: [{ scale: pop }] }]}>
              <Image source={require('../../../assets/icon.png')} style={styles.logoImg} />
            </Animated.View>
            <Text style={styles.title}>Create your account</Text>
          </View>

          <Reveal delay={120} style={styles.card} slide={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.plainInput}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              style={{ marginBottom: 16 }}
            />

            <Text style={styles.label}>Referral code (optional)</Text>
            <TextInput
              style={[
                styles.plainInput,
                refState === 'bad' && { borderColor: colors.danger },
                refState === 'ok' && { borderColor: '#34d399' },
              ]}
              placeholder="UB3-XXXXX"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              value={refCode}
              onChangeText={onRefChange}
            />
            {refState === 'ok' ? <Text style={styles.refOk}>Valid code. Your welcome reward is unlocked.</Text> : null}
            {refState === 'bad' ? <Text style={styles.refBad}>This code does not exist.</Text> : null}

            <View style={{ height: 8 }} />
            <PrimaryButton title="Create account" onPress={onSubmit} loading={loading} />
          </Reveal>

          <Reveal delay={240} style={{ alignItems: 'center' }}>
            <Pressable onPress={() => navigation.goBack()} style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.link}>Sign in</Text>
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
    backgroundColor: '#4C1D95', paddingBottom: 66, alignItems: 'center', overflow: 'hidden',
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
    width: 76, height: 76, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#1a0b3d', shadowOpacity: 0.45, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  logoImg: { width: 56, height: 56, borderRadius: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
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
  plainInput: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: 16,
    paddingHorizontal: 16, height: 52, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  refOk: { color: '#16a34a', fontSize: 13, fontWeight: '600', marginTop: -6, marginBottom: 8 },
  refBad: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: -6, marginBottom: 8 },
  link: { color: colors.violet, fontWeight: '700' },
  footer: { marginTop: 26 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
});
