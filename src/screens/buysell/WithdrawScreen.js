import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';

function Reveal({ index, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function WithdrawScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [mode, setMode] = useState('ngn');
  const isCrypto = mode === 'crypto';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Reveal index={0} style={styles.headerRow}>
          <View style={styles.badge}>
            <Feather name="upload" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing(4) }}>
            <Text style={styles.title}>Withdraw</Text>
            <Text style={styles.headerSub}>Move your money out of UB3 Pay</Text>
          </View>
        </Reveal>

        <Reveal index={1} style={styles.segment}>
          <Pressable onPress={() => setMode('ngn')} style={[styles.segBtn, isCrypto ? null : styles.segActive]}>
            <Feather name="home" size={15} color={isCrypto ? colors.textSecondary : '#fff'} />
            <Text style={[styles.segLabel, isCrypto ? null : styles.segLabelActive]}>Naira</Text>
          </Pressable>
          <Pressable onPress={() => setMode('crypto')} style={[styles.segBtn, isCrypto ? styles.segActive : null]}>
            <Feather name="link" size={15} color={isCrypto ? '#fff' : colors.textSecondary} />
            <Text style={[styles.segLabel, isCrypto ? styles.segLabelActive : null]}>Crypto</Text>
          </Pressable>
        </Reveal>

        <Reveal index={2} style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Feather name={isCrypto ? 'send' : 'home'} size={20} color={VIOLET} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{isCrypto ? 'Send to a wallet' : 'Withdraw to bank'}</Text>
            <Text style={styles.infoText}>
              {isCrypto
                ? 'Send crypto to an external wallet \u2014 use the Send screen from any asset.'
                : 'Withdraw to a linked bank account.'}
            </Text>
          </View>
        </Reveal>

        <View style={{ flex: 1 }} />

        <Reveal index={3}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
            onPress={() => (isCrypto ? navigation.navigate('Send') : navigation.navigate('NairaWithdraw'))}
          >
            <Text style={styles.ctaText}>{isCrypto ? 'Choose an asset to send' : 'Withdraw to bank'}</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </Pressable>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(8), paddingBottom: spacing(28) },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(6) },
  badge: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  segment: {
    flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 22, padding: 5, marginBottom: spacing(5),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing(3), borderRadius: 18 },
  segActive: {
    backgroundColor: VIOLET,
    shadowColor: VIOLET, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  segLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  segLabelActive: { color: '#fff', fontWeight: '800' },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  infoIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  infoText: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: VIOLET, borderRadius: 999, paddingVertical: spacing(4.5),
    shadowColor: VIOLET, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 10,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
