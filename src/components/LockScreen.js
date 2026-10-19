import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Image, Alert, Vibration, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { apiPost } from '../services/api';
import { biometricAvailable, biometricLabel, authenticate, getBioPref, setBioPref } from '../services/biometric';
import UB3Loader from './UB3Loader';
import ForgotPinModal from './ForgotPinModal';

const MSG = {
  PIN_INVALID: 'Wrong PIN. Try again.',
  PIN_LOCKED: 'Too many wrong attempts. Try again in 15 minutes.',
  PIN_REQUIRED: 'Enter your 4-digit PIN.',
};
const ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['bio', '0', 'del']];

export default function LockScreen({ uid, onUnlocked, onSignOut }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = getStyles(colors);
  const KEY = height < 700 ? 60 : 70;

  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  const [bio, setBio] = useState({ available: false, enabled: false, label: 'Biometrics', pref: null });
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.6)).current;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onUnlocked();
  };

  const tryBio = async () => {
    const ok = await authenticate('Unlock UB3 Pay');
    if (ok) finish();
  };

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    let alive = true;
    (async () => {
      const available = await biometricAvailable();
      const pref = await getBioPref(uid);
      const label = available ? await biometricLabel() : 'Biometrics';
      if (!alive) return;
      const enabled = available && pref === '1';
      setBio({ available, enabled, label, pref });
      if (enabled) tryBio();
    })();
    return () => { alive = false; };
  }, []);

  const doShake = () => {
    Vibration.vibrate(60);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const afterSuccess = () => {
    if (bio.available && bio.pref === null) {
      Alert.alert(
        'Enable ' + bio.label + '?',
        'Unlock UB3 Pay faster next time. Your PIN will always still work.',
        [
          { text: 'Not now', style: 'cancel', onPress: async () => { await setBioPref(uid, '0'); finish(); } },
          {
            text: 'Enable',
            onPress: async () => {
              const ok = await authenticate('Confirm to enable ' + bio.label);
              await setBioPref(uid, ok ? '1' : '0');
              finish();
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      finish();
    }
  };

  const verify = async (p) => {
    setBusy(true);
    try {
      await apiPost('/pin/verify', { pin: p });
      setBusy(false);
      afterSuccess();
    } catch (err) {
      setBusy(false);
      const c = (err && (err.code || err.message)) || '';
      if (c === 'PIN_NOT_SET') { finish(); return; }
      setPin('');
      doShake();
      setError(MSG[c] || 'Could not verify. Check your connection and try again.');
    }
  };

  const press = (d) => {
    if (busy || done.current) return;
    setError('');
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) verify(next);
  };

  const back = () => { if (!busy) setPin((p) => p.slice(0, -1)); };

  const renderKey = (k) => {
    if (k === 'bio') {
      if (!bio.enabled) return <View key={k} style={{ width: KEY, height: KEY }} />;
      const icon = bio.label.indexOf('Face') === 0 ? 'face-recognition' : 'fingerprint';
      return (
        <Pressable key={k} onPress={tryBio} style={[styles.key, { width: KEY, height: KEY, borderRadius: KEY / 2 }]}>
          <MaterialCommunityIcons name={icon} size={30} color={colors.violet} />
        </Pressable>
      );
    }
    if (k === 'del') {
      return (
        <Pressable key={k} onPress={back} style={[styles.keyPlain, { width: KEY, height: KEY }]}>
          <Feather name="delete" size={24} color={colors.textPrimary} />
        </Pressable>
      );
    }
    return (
      <Pressable
        key={k}
        onPress={() => press(k)}
        style={({ pressed }) => [styles.key, { width: KEY, height: KEY, borderRadius: KEY / 2 }, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.keyText}>{k}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { paddingTop: insets.top + 26 }]}>
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <Animated.View style={[styles.logoPlate, { transform: [{ scale: pop }] }]}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Enter your PIN to unlock</Text>
      </View>

      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotOn]} />
        ))}
      </Animated.View>

      <View style={styles.msgBox}>
        {busy ? <UB3Loader size={34} color={colors.violet} /> : error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.pad}>
        {ROWS.map((row, i) => (
          <View key={i} style={styles.padRow}>{row.map(renderKey)}</View>
        ))}
      </View>

      <View style={styles.links}>
        <Pressable onPress={() => setForgot(true)} hitSlop={10}>
          <Text style={styles.link}>Forgot PIN?</Text>
        </Pressable>
        <Pressable onPress={onSignOut} hitSlop={10}>
          <Text style={[styles.link, { color: colors.textSecondary }]}>Sign out</Text>
        </Pressable>
      </View>

      {forgot ? (
        <ForgotPinModal
          visible
          onClose={() => setForgot(false)}
          onDone={() => { setForgot(false); setError(''); setPin(''); }}
        />
      ) : null}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 28, borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
    overflow: 'hidden', alignItems: 'center',
  },
  glowA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -70, left: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(139,92,246,0.35)' },
  logoPlate: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  logo: { width: 42, height: 42 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.78)', fontSize: 14, marginTop: 4 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 28 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.violet, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: colors.violet },
  msgBox: { height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  pad: { alignItems: 'center', gap: 12 },
  padRow: { flexDirection: 'row', gap: 22 },
  key: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2a1260', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  keyPlain: { alignItems: 'center', justifyContent: 'center' },
  keyText: { color: colors.textPrimary, fontSize: 26, fontWeight: '700' },
  links: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: 20 },
  link: { color: colors.violet, fontSize: 14, fontWeight: '700' },
});
