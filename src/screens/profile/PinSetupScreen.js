import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import PinPad from '../../components/PinPad';
import ForgotPinModal from '../../components/ForgotPinModal';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import UB3Loader from '../../components/UB3Loader';
import * as walletService from '../../services/walletService';

const SHADOW = '#2a1260';

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380, delay: Math.min(index, 9) * 70, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function PinSetupScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [hasPin, setHasPin] = useState(null);
  const [stage, setStage] = useState(null);
  const [cur, setCur] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [phase, setPhase] = useState(null);
  const [doneTitle, setDoneTitle] = useState('PIN saved');

  useLayoutEffect(() => {
    if (navigation && navigation.setOptions) navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    walletService.getPinStatus()
      .then((s) => setHasPin(!!(s && s.hasPin)))
      .catch(() => setHasPin(false));
  }, []);

  const flashSuccess = (title) => {
    setDoneTitle(title);
    setPhase('success');
    setTimeout(() => setPhase(null), 1400);
  };

  const start = () => {
    setMsg('');
    setError('');
    setCur('');
    setFirst('');
    setStage(hasPin ? 'current' : 'new');
  };

  const onComplete = async (pin) => {
    if (stage === 'current') { setCur(pin); setError(''); setStage('new'); return; }
    if (stage === 'new') { setFirst(pin); setError(''); setStage('confirm'); return; }
    if (stage === 'confirm') {
      if (pin !== first) { setError('PINs do not match. Start again.'); setFirst(''); setStage('new'); return; }
      setBusy(true);
      try {
        await walletService.setPin(pin, hasPin ? cur : undefined);
        const changed = hasPin;
        setHasPin(true);
        setStage(null);
        setMsg(changed ? 'Your PIN has been changed.' : 'Your PIN has been created.');
        flashSuccess(changed ? 'PIN changed' : 'PIN created');
      } catch (e) {
        const code = (e && (e.code || e.message)) || '';
        if (code === 'PIN_INVALID') { setError('Current PIN is wrong.'); setStage('current'); }
        else if (code === 'PIN_LOCKED') { setError('Too many wrong attempts. Try again in 15 minutes.'); setStage('current'); }
        else { setError('Could not save your PIN. Try again.'); setStage('new'); }
      }
      setBusy(false);
    }
  };

  const title = stage === 'current' ? 'Enter current PIN' : stage === 'new' ? (hasPin ? 'Create new PIN' : 'Create a PIN') : 'Confirm new PIN';
  const subtitle = stage === 'current' ? 'Enter your current 4-digit PIN' : stage === 'new' ? 'Choose a 4-digit PIN' : 'Enter the PIN again to confirm';

  const protects = [
    { icon: 'send', text: 'Sending crypto' },
    { icon: 'arrow-up-right', text: 'Naira withdrawals' },
    { icon: 'smartphone', text: 'Airtime and data purchases' },
    { icon: 'unlock', text: 'Unlocking the app when you open it' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Transaction PIN</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.lockCircle}>
            <Feather name="lock" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroSub}>Your 4-digit PIN approves sends, withdrawals, airtime and data, and unlocks the app.</Text>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <View style={styles.statusRow}>
              {hasPin === null ? (
                <UB3Loader size={34} color={colors.violet} />
              ) : (
                <View style={[styles.statusIcon, { backgroundColor: hasPin ? 'rgba(34,197,94,0.14)' : 'rgba(251,191,36,0.16)' }]}>
                  <Feather name={hasPin ? 'shield' : 'alert-triangle'} size={20} color={hasPin ? '#22C55E' : '#fbbf24'} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  {hasPin === null ? 'Checking...' : hasPin ? 'PIN is active' : 'No PIN yet'}
                </Text>
                <Text style={styles.statusSub}>
                  {hasPin === null ? '' : hasPin ? 'A PIN is set on your account.' : 'You have not set a PIN yet.'}
                </Text>
              </View>
            </View>

            {msg ? (
              <View style={styles.okBox}>
                <Feather name="check-circle" size={16} color="#22C55E" />
                <Text style={styles.okText}>{msg}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={start}
              disabled={hasPin === null}
              style={({ pressed }) => [styles.bigBtn, hasPin === null && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.bigBtnText}>{hasPin ? 'Change PIN' : 'Create PIN'}</Text>
            </Pressable>

            {hasPin ? (
              <Pressable onPress={() => setForgot(true)} hitSlop={8} style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot your PIN?</Text>
              </Pressable>
            ) : null}
          </Reveal>

          <Reveal index={1} style={styles.card}>
            <Text style={styles.cardTitle}>What your PIN protects</Text>
            {protects.map((p, i) => (
              <View key={p.text} style={[styles.protRow, i === protects.length - 1 && { marginBottom: 0 }]}>
                <View style={styles.protIcon}>
                  <Feather name={p.icon} size={16} color={colors.violet} />
                </View>
                <Text style={styles.protText}>{p.text}</Text>
              </View>
            ))}
          </Reveal>

          <Reveal index={2} style={styles.note}>
            <Feather name="info" size={15} color={colors.violet} />
            <Text style={styles.noteText}>Never share your PIN with anyone. UB3 Pay will never ask you for it.</Text>
          </Reveal>
        </View>
      </ScrollView>

      {forgot ? (
        <ForgotPinModal
          visible
          onClose={() => setForgot(false)}
          onDone={() => {
            setForgot(false);
            setStage(null);
            setMsg('Your PIN has been reset.');
            setHasPin(true);
            flashSuccess('PIN reset');
          }}
        />
      ) : (
        <PinPad
          visible={!!stage}
          title={title}
          subtitle={subtitle}
          error={error}
          busy={busy}
          onComplete={onComplete}
          onCancel={() => { setStage(null); setError(''); }}
          onForgot={stage === 'current' ? () => setForgot(true) : undefined}
        />
      )}

      <ProcessingOverlay
        visible={phase !== null}
        phase={phase}
        title={doneTitle}
        subtitle="Your transactions are protected"
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
    overflow: 'hidden', alignItems: 'center',
  },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  lockCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 34 },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  statusSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  okBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 14,
  },
  okText: { color: '#22C55E', fontSize: 13, fontWeight: '600', flex: 1 },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginTop: 18,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  forgotLink: { alignSelf: 'center', marginTop: 16 },
  forgotText: { color: colors.violet, fontSize: 14, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 14 },
  protRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  protIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  protText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  note: { flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginTop: 16, alignItems: 'flex-start' },
  noteText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
});
