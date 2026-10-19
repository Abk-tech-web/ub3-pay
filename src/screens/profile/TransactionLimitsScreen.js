import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiGet } from '../../services/api';

const SHADOW = '#2a1260';

const DEFAULTS = {
  ngn: { daily: 5000000, dailyWithdraw: 5000000, perTx: 1000000, dailyDeposit: null },
  airtime: { daily: 50000, perTx: 10000 },
  bills: { daily: 100000 },
};

const naira = (n) => '\u20A6' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
  const [limits, setLimits] = useState(DEFAULTS);
  const [used, setUsed] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await apiGet('/limits');
      if (r && r.limits) setLimits({ ...DEFAULTS, ...r.limits });
      setUsed((r && r.usedToday) || {});
    } catch (e) {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const L = limits;
  const sections = [
    {
      title: 'Crypto',
      icon: 'layers',
      rows: [
        { label: 'Deposit limit', value: null },
        { label: 'Withdraw limit', value: null },
      ],
    },
    {
      title: 'Naira',
      icon: 'credit-card',
      rows: [
        { label: 'Daily limit', value: L.ngn.daily, used: used ? used.out : null },
        { label: 'Daily deposit', value: L.ngn.dailyDeposit },
        { label: 'Daily withdraw', value: L.ngn.dailyWithdraw, used: used ? used.withdraw : null },
        { label: 'Per transaction', value: L.ngn.perTx },
      ],
    },
    {
      title: 'Airtime & Bills',
      icon: 'smartphone',
      rows: [
        { label: 'Airtime daily limit', value: L.airtime.daily, used: used ? used.airtime : null },
        { label: 'Airtime per transaction', value: L.airtime.perTx },
        { label: 'Data & other bills daily limit', value: L.bills.daily, used: used ? used.bills : null },
      ],
    },
  ];

  const renderRow = (row, i, arr) => {
    const unlimited = row.value === null || row.value === undefined;
    const hasBar = !unlimited && row.used !== null && row.used !== undefined;
    const pct = hasBar ? Math.min(100, Math.round((row.used / row.value) * 100)) : 0;
    const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#fbbf24' : colors.violet;
    return (
      <View key={row.label} style={[styles.row, i !== arr.length - 1 && styles.rowBorder]}>
        <View style={styles.rowTop}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          {unlimited ? (
            <View style={styles.unlimited}>
              <Text style={styles.unlimitedText}>Unlimited</Text>
            </View>
          ) : (
            <Text style={styles.rowValue}>{naira(row.value)}</Text>
          )}
        </View>
        {hasBar ? (
          <View style={{ marginTop: 10 }}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: pct + '%', backgroundColor: barColor }]} />
            </View>
            <Text style={styles.usedText}>
              {naira(row.used)} used today · {naira(Math.max(0, row.value - row.used))} left
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

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
          <Text style={styles.heroSub}>Your limits for crypto, naira, airtime and bills, and how much you have used today.</Text>
        </View>

        <View style={styles.body}>
          {sections.map((section, si) => (
            <Reveal key={section.title} index={si} style={[styles.card, si === 0 && { marginTop: -34 }]}>
              <View style={styles.cardHead}>
                <View style={styles.iconTile}>
                  <Feather name={section.icon} size={18} color={colors.violet} />
                </View>
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              {section.rows.map((row, i, arr) => renderRow(row, i, arr))}
            </Reveal>
          ))}

          <Reveal index={3} style={styles.note}>
            <Feather name="clock" size={15} color={colors.violet} />
            <Text style={styles.noteText}>Daily limits reset every night at midnight (Lagos time).</Text>
          </Reveal>
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
  row: { paddingVertical: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  rowValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  unlimited: { backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  unlimitedText: { color: '#22C55E', fontSize: 12, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  usedText: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  note: { flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginTop: 16, alignItems: 'flex-start' },
  noteText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
});
