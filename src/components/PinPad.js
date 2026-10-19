import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Vibration } from 'react-native';
import ActivityIndicator from './UB3Loader';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function Dot({ filled, styles }) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0)).current;
  useEffect(() => {
    if (filled) {
      scale.setValue(0.5);
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 170, useNativeDriver: true }).start();
    } else {
      scale.setValue(0);
    }
  }, [filled]);
  return (
    <View style={styles.dotRing}>
      <Animated.View style={[styles.dotFill, { opacity: filled ? 1 : 0, transform: [{ scale: scale }] }]} />
    </View>
  );
}

function Key({ k, onPress, styles, iconColor }) {
  if (k === '') return <View style={styles.keyWrap} />;
  return (
    <View style={styles.keyWrap}>
      <Pressable
        onPress={() => onPress(k)}
        style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
      >
        {k === 'del' ? (
          <Feather name="delete" size={26} color={iconColor} />
        ) : (
          <Text style={styles.keyText}>{k}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function PinPad({ visible, title, subtitle, error, busy, onComplete, onCancel, onForgot }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [digits, setDigits] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDigits('');
  }, [visible, title]);

  useEffect(() => {
    if (!error) return;
    Vibration.vibrate(120);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 7, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -7, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 55, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [error]);

  const press = (k) => {
    if (busy) return;
    if (k === 'del') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= 4) return;
    Vibration.vibrate(8);
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        setDigits('');
        if (onComplete) onComplete(next);
      }, 160);
    }
  };

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.grabber} />
          <View style={styles.badge}>
            <Feather name="lock" size={22} color="#fff" />
          </View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <Dot key={i} filled={i < digits.length} styles={styles} />
            ))}
          </Animated.View>

          <View style={styles.statusRow}>
            {busy ? <ActivityIndicator color={VIOLET} /> : error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.pad}>
            {KEYS.map((k, idx) => (
              <Key key={idx} k={k} onPress={press} styles={styles} iconColor={VIOLET} />
            ))}
          </View>

          {onForgot ? (
            <Pressable onPress={onForgot} style={styles.forgotBtn}>
              <Text style={styles.link}>Forgot PIN?</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onCancel} disabled={busy} style={styles.cancelBtn}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,10,45,0.55)' },
  card: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, alignItems: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 24,
  },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(124,58,237,0.25)', marginBottom: 18 },
  badge: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: SHADOW, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { fontSize: 21, fontWeight: '800', textAlign: 'center', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  dotRing: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#C4B5FD', marginHorizontal: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  dotFill: { width: 18, height: 18, borderRadius: 9, backgroundColor: VIOLET, position: 'absolute' },
  statusRow: { minHeight: 34, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 6 },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  keyWrap: { width: '33.33%', height: 82, alignItems: 'center', justifyContent: 'center' },
  key: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  keyPressed: { backgroundColor: 'rgba(124,58,237,0.22)', transform: [{ scale: 0.92 }], shadowOpacity: 0.04, elevation: 0 },
  keyText: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  forgotBtn: {
    marginTop: 8, backgroundColor: 'rgba(124,58,237,0.10)', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 9,
  },
  link: { color: VIOLET, fontWeight: '800', fontSize: 14 },
  cancelBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 24 },
  cancel: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
