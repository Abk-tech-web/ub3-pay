import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import useUb3Id from '../../hooks/useUb3Id';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarColor } from '../../utils/avatarColor';
import { apiGet } from '../../services/api';

const SHADOW = '#2a1260';
const KYC_META = {
  approved: { label: 'Verified', color: '#4ade80', bg: 'rgba(34,197,94,0.22)', icon: 'shield' },
  pending: { label: 'Pending', color: '#fde047', bg: 'rgba(250,204,21,0.22)', icon: 'clock' },
  unverified: { label: 'Not Verified', color: '#fde047', bg: 'rgba(250,204,21,0.22)', icon: 'shield-off' },
};

const naira = (n) => '\u20A6' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pretty = (id) => (/^[0-9]{8}$/.test(id || '') ? id.slice(0, 4) + ' ' + id.slice(4) : id ? '@' + id : '...');

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

export default function AccountSnapshotScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const ub3Id = useUb3Id();
  const [copied, setCopied] = useState(false);
  const [lim, setLim] = useState(null);

  const kycKey = user && user.bvnVerified && user.accountNumber ? 'approved' : user && user.bvnVerified ? 'pending' : 'unverified';
  const kyc = KYC_META[kycKey];
  const fullName = [user && user.firstName, user && user.lastName].filter(Boolean).join(' ');
  const displayName = fullName || (user && user.email) || 'UB3 Pay User';
  const initial = (fullName || (user && user.email) || 'U').charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(user && user.uid);

  useFocusEffect(useCallback(() => {
    let alive = true;
    apiGet('/limits')
      .then((r) => {
        if (alive && r && r.limits && r.limits.ngn) {
          setLim({ daily: r.limits.ngn.daily, used: (r.usedToday && r.usedToday.out) || 0 });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []));

  const copyId = async () => {
    if (!ub3Id) return;
    await Clipboard.setStringAsync(ub3Id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const pct = lim && lim.daily ? Math.min(100, Math.round((lim.used / lim.daily) * 100)) : 0;
  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#fbbf24' : colors.violet;

  const Row = ({ icon, label, value, valueColor, sub, last }) => (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.iconTile}>
        <Feather name={icon} size={17} color={colors.violet} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>{value}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </View>
  );

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
            <Text style={styles.heroTitle}>Account</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.avatarRing}>
            <View style={[styles.avatar, { backgroundColor: avatarColor, overflow: 'hidden' }]}>
              {user && user.photoUrl ? <Image source={{ uri: user.photoUrl }} style={styles.avatarImg} /> : null}
              {user && user.photoUrl ? null : <Text style={styles.avatarLetter}>{initial}</Text>}
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {fullName && user && user.email ? <Text style={styles.email} numberOfLines={1}>{user.email}</Text> : null}
          <View style={[styles.kycBadge, { backgroundColor: kyc.bg }]}>
            <Feather name={kyc.icon} size={12} color={kyc.color} />
            <Text style={[styles.kycText, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <Text style={styles.cardLabel}>YOUR UB3 ID</Text>
            <View style={styles.idRow}>
              <Text style={styles.idBig} numberOfLines={1} adjustsFontSizeToFit>{pretty(ub3Id)}</Text>
              <Pressable
                onPress={copyId}
                hitSlop={8}
                style={({ pressed }) => [styles.copyBtn, copied && { backgroundColor: 'rgba(34,197,94,0.16)' }, pressed && { opacity: 0.8 }]}
              >
                <Feather name={copied ? 'check' : 'copy'} size={15} color={copied ? '#22C55E' : colors.violet} />
                <Text style={[styles.copyText, copied && { color: '#22C55E' }]}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
            </View>
            <Text style={styles.idHint}>Share your UB3 ID so other UB3 Pay users can send you money.</Text>
          </Reveal>

          <Reveal index={1} style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            <Row icon="mail" label="Email" value={(user && user.email) || '-'} />
            <Row
              icon="shield"
              label="BVN"
              value={kycKey === 'unverified' ? 'Not verified' : 'Verified'}
              valueColor={kycKey === 'unverified' ? '#f59e0b' : '#22C55E'}
              last={!(user && user.accountNumber)}
            />
            {user && user.accountNumber ? (
              <Row
                icon="credit-card"
                label="Naira account"
                value={String(user.accountNumber)}
                sub={user.accountBank ? String(user.accountBank) : null}
                last
              />
            ) : null}
          </Reveal>

          <Reveal index={2} style={styles.card}>
            <Text style={styles.cardTitle}>Daily transaction limit</Text>
            {lim ? (
              <View style={{ marginTop: 12 }}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: pct + '%', backgroundColor: barColor }]} />
                </View>
                <Text style={styles.usedText}>{naira(lim.used)} used of {naira(lim.daily)} today</Text>
              </View>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.8 }]}
              onPress={() => navigation.navigate('TransactionLimits')}
            >
              <Text style={styles.linkText}>View all limits</Text>
              <Feather name="chevron-right" size={18} color={colors.violet} />
            </Pressable>
          </Reveal>

          {kycKey !== 'approved' ? (
            <Reveal index={3} style={styles.hintCard}>
              <Feather name="info" size={16} color="#f59e0b" />
              <Text style={styles.hintText}>
                {kycKey === 'pending'
                  ? 'Your BVN is verified. Naira account setup is in progress.'
                  : 'Verify your BVN to unlock withdrawals, airtime, and data.'}
              </Text>
            </Reveal>
          ) : null}
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
  avatarRing: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#A78BFA', shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  avatar: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 34, fontWeight: '800' },
  avatarImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  name: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 12, paddingHorizontal: 30 },
  email: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3, paddingHorizontal: 30 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  kycText: { fontSize: 12, fontWeight: '800' },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  idBig: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: 2, flex: 1 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.14)', borderRadius: 18, paddingHorizontal: 14, height: 38,
  },
  copyText: { color: colors.violet, fontSize: 13, fontWeight: '800' },
  idHint: { color: colors.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  iconTile: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  rowValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  usedText: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  linkText: { color: colors.violet, fontSize: 14, fontWeight: '800' },
  hintCard: {
    flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.14)', borderRadius: 18, padding: 14, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  hintText: { color: colors.textPrimary, fontSize: 13, flex: 1, lineHeight: 19 },
});
