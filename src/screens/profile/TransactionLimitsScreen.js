import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const SHADOW = '#2a1260';

const SECTIONS = [
  {
    title: 'Crypto',
    icon: 'layers',
    rows: [
      { label: 'Deposit limit', value: 'Unlimited' },
      { label: 'Withdraw limit', value: 'Unlimited' },
    ],
  },
  {
    title: 'Naira',
    icon: 'credit-card',
    rows: [
      { label: 'Daily limit', value: '\u20a610,000,000' },
      { label: 'Daily deposit', value: 'Unlimited' },
      { label: 'Daily withdraw', value: '\u20a610,000,000' },
      { label: 'Per transaction', value: '\u20a65,000,000' },
    ],
  },
  {
    title: 'Airtime & Bills',
    icon: 'smartphone',
    rows: [
      { label: 'Airtime daily limit', value: '\u20a6200,000' },
      { label: 'Airtime per transaction', value: '\u20a650,000' },
      { label: 'Other bills daily limit', value: '\u20a61,000,000' },
    ],
  },
];

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380, delay: Math.min(index, 9) * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function TransactionLimitsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

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
            <Text style={styles.heroTitle}>Transaction Limits</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.iconCircle}>
            <Feather name="sliders" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroSub}>Your current limits for crypto, naira, airtime and bills.</Text>
        </View>

        <View style={styles.body}>
          {SECTIONS.map((section, si) => (
            <Reveal key={section.title} index={si} style={[styles.card, si === 0 && { marginTop: -34 }]}>
              <View style={styles.cardHead}>
                <View style={styles.iconTile}>
                  <Feather name={section.icon} size={18} color={colors.violet} />
                </View>
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              {section.rows.map((row, i) => (
                <View key={row.label} style={[styles.row, i !== section.rows.length - 1 && styles.rowBorder]}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  {row.value === 'Unlimited' ? (
                    <View style={styles.unlimited}>
                      <Text style={styles.unlimitedText}>Unlimited</Text>
                    </View>
                  ) : (
                    <Text style={styles.rowValue}>{row.value}</Text>
                  )}
                </View>
              ))}
            </Reveal>
          ))}
        </View>
      </ScrollView>
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
  iconCircle: {
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
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  iconTile: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  rowValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  unlimited: { backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  unlimitedText: { color: '#22C55E', fontSize: 12, fontWeight: '800' },
});
