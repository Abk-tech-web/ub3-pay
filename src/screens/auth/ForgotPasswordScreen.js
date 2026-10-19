import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Animated, Image, Pressable,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import PrimaryButton from '../../components/PrimaryButton';
import * as authService from '../../services/authService';
import { isValidEmail } from '../../utils/validators';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    Animated.timing(cardFade, { toValue: 1, duration: 450, delay: 150, useNativeDriver: true }).start();
  }, []);

  const onSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { paddingTop: insets.top + 30 }]}>
            <View style={styles.glowA} />
            <View style={styles.glowB} />
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { top: insets.top + 10 }]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Animated.View style={[styles.logoPlate, { transform: [{ scale: logoScale }] }]}>
              <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            </Animated.View>
            <Text style={styles.heroTitle}>{sent ? 'Check your email' : 'Reset password'}</Text>
            <Text style={styles.heroSub}>
              {sent ? 'We have sent you a reset link' : 'We will email you a reset link'}
            </Text>
          </View>

          <Animated.View style={[styles.card, { opacity: cardFade }]}>
            {sent ? (
              <View style={{ alignItems: 'center' }}>
                <View style={styles.tickCircle}>
                  <Ionicons name="checkmark" size={34} color="#FFFFFF" />
                </View>
                <Text style={styles.sentText}>
                  If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.
                </Text>
                <View style={{ alignSelf: 'stretch', marginTop: 22 }}>
                  <PrimaryButton title="Back to sign in" onPress={() => navigation.goBack()} />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Email address</Text>
                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <PrimaryButton title="Send reset link" onPress={onSubmit} loading={loading} />
                <Pressable onPress={() => navigation.goBack()} style={styles.backLink} hitSlop={8}>
                  <Text style={styles.backLinkText}>Back to sign in</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: '#4C1D95',
    paddingBottom: 66,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    overflow: 'hidden',
    alignItems: 'center',
  },
  glowA: {
    position: 'absolute', top: -60, right: -50, width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)',
  },
  glowB: {
    position: 'absolute', bottom: -70, left: -50, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(139,92,246,0.35)',
  },
  backBtn: {
    position: 'absolute', left: 16, width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  logoPlate: {
    width: 76, height: 76, borderRadius: 22, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  logo: { width: 50, height: 50 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 14, marginTop: 6 },
  card: {
    marginTop: -40, marginHorizontal: 20, backgroundColor: colors.bgCard,
    borderRadius: 28, padding: 22,
    shadowColor: '#2a1260', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 12,
  },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: 16,
    paddingHorizontal: 16, height: 52, marginBottom: 18,
    borderWidth: 1, borderColor: colors.border,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  backLink: { alignSelf: 'center', marginTop: 18 },
  backLinkText: { color: colors.violet, fontSize: 14, fontWeight: '700' },
  tickCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#22C55E', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  sentText: { color: colors.textPrimary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
