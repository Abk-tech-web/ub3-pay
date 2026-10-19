import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { BackHandler } from 'react-native';

const API_BASE = 'https://ub3-pay-backend.onrender.com';

function Reveal({ delay = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={[style, { opacity: v }]}>{children}</Animated.View>;
}

// Real OTP verification: we send a 6-digit code to the user's email via our
// backend/Postmark, they type it in, we verify it against Firestore.
export default function VerifyEmailScreen({ route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { email } = route.params ?? {};
  const { refreshEmailVerified, signOut } = useAuth();
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { signOut(); return true; });
    return () => sub.remove();
  }, []);

  const onSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch(API_BASE + '/auth/send-otp', {
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
      const res = await fetch(API_BASE + '/auth/verify-otp', {
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

  const target = email ? email : 'your email';
  const subtitle = sent
    ? 'Enter the 6-digit code we sent to ' + target + '.'
    : 'We\u2019ll send a verification code to ' + target + '.';

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { paddingTop: insets.top + 30 }]}>
            <Pressable onPress={() => signOut()} hitSlop={10} style={{ position: 'absolute', left: 16, top: insets.top + 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 10 }}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.heroGlow} />
            <View style={styles.heroGlow2} />
            <Animated.View style={[styles.logoPlate, { transform: [{ scale: pop }] }]}>
              <Image source={require('../../../assets/icon.png')} style={styles.logoImg} />
            </Animated.View>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <Reveal delay={120} style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!sent ? (
              <PrimaryButton title="Send code" onPress={onSend} loading={sending} />
            ) : (
              <>
                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="123456"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <PrimaryButton title="Verify" onPress={onVerify} loading={checking} />

                <Pressable onPress={onSend} style={styles.resend}>
                  <Text style={styles.link}>Resend code</Text>
                </Pressable>
              </>
            )}
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 66, paddingHorizontal: 28, alignItems: 'center',
    overflow: 'hidden', borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
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
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
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
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  otpInput: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: 18, height: 64,
    borderWidth: 1.5, borderColor: colors.violet, fontSize: 26, fontWeight: '800',
    letterSpacing: 10, textAlign: 'center', marginBottom: 18,
  },
  resend: { marginTop: 20, alignSelf: 'center' },
  link: { color: colors.violet, fontWeight: '700' },
});
