import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useUb3Id from '../../hooks/useUb3Id';
import { getAvatarColor } from '../../utils/avatarColor';
import { NotificationBadge } from '../../components/NotificationIndicators';

const SHADOW = '#2a1260';

const HELP = {
  title: 'Help',
  rows: [
    { key: 'Support', label: 'Customer service', sub: 'Chat with our team, 9am to 11pm', icon: 'headphones', color: '#06b6d4' },
    { key: 'Support', params: { report: true }, label: 'Report an issue', sub: 'Tell us what went wrong', icon: 'alert-triangle', color: '#ef4444' },
  ],
};

const SECTIONS = [
  {
    title: 'Rewards',
    rows: [
      { key: 'Referral', label: 'Invite & Earn', sub: 'Earn airtime when friends join', icon: 'gift', color: '#f59e0b' },
    ],
  },
  {
    title: 'Account',
    rows: [
      { key: 'VerifyBvn', label: 'Verify BVN', sub: '', icon: 'shield', color: '#10b981' },
      { key: 'Notifications', label: 'Notifications', sub: 'Updates from UB3 Pay', icon: 'bell', color: '#8b5cf6' },
    ],
  },
  {
    title: 'Security & limits',
    rows: [
      { key: 'SecuritySettings', label: 'Security', sub: 'Biometric unlock and app lock', icon: 'lock', color: '#3b82f6' },
      { key: 'PinSetup', label: 'Transaction PIN', sub: 'Approve payments with your PIN', icon: 'key', color: '#8b5cf6' },
      { key: 'TransactionLimits', label: 'Transaction Limits', sub: 'Daily and per transfer limits', icon: 'sliders', color: '#3b82f6' },
    ],
  },
];

const prettyId = (id) => (/^[0-9]{8}$/.test(id || '') ? id.slice(0, 4) + ' ' + id.slice(4) : id ? '@' + id : '...');

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 340, delay: Math.min(index, 9) * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const ub3Id = useUb3Id();
  const [confirmOut, setConfirmOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const verified = !!(user && user.bvnVerified === true);
  const fullName = [user && user.firstName, user && user.lastName].filter(Boolean).join(' ');
  const email = (user && user.email) || '';
  const title = fullName || email || 'UB3 Pay User';
  const letter = (fullName || email || 'U').charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(user && user.uid);
  const acctNo = user && user.accountNumber ? String(user.accountNumber) : '';
  const acctText = acctNo ? '\u2022\u2022\u2022\u2022 ' + acctNo.slice(-4) : (verified ? 'Setting up' : 'Not set');

  const copyId = async () => {
    if (!ub3Id) return;
    await Clipboard.setStringAsync(ub3Id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  let rowIndex = 3;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <Text style={styles.heroTitle}>Profile</Text>
          <View style={styles.avatarRing}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarLetter}>{letter}</Text>
            </View>
            {verified ? (
              <View style={styles.verifiedDot}>
                <Feather name="check" size={13} color="#fff" />
              </View>
            ) : null}
          </View>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          {fullName && email ? <Text style={styles.email} numberOfLines={1}>{email}</Text> : null}
          <View style={[styles.kycBadge, { backgroundColor: verified ? 'rgba(34,197,94,0.22)' : 'rgba(250,204,21,0.22)' }]}>
            <Feather name={verified ? 'shield' : 'shield-off'} size={12} color={verified ? '#4ade80' : '#fde047'} />
            <Text style={[styles.kycText, { color: verified ? '#4ade80' : '#fde047' }]}>{verified ? 'Verified' : 'Not verified'}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <Text style={styles.cardLabel}>YOUR UB3 ID</Text>
            <View style={styles.idRow}>
              <Text style={styles.idBig} numberOfLines={1} adjustsFontSizeToFit>{prettyId(ub3Id)}</Text>
              <Pressable
                onPress={copyId}
                hitSlop={8}
                style={({ pressed }) => [styles.copyBtn, copied && { backgroundColor: 'rgba(34,197,94,0.16)' }, pressed && { opacity: 0.8 }]}
              >
                <Feather name={copied ? 'check' : 'copy'} size={15} color={copied ? '#22C55E' : colors.violet} />
                <Text style={[styles.copyText, copied && { color: '#22C55E' }]}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Ub3Id')} hitSlop={8} style={styles.editBtn}>
                <Feather name="edit-2" size={15} color={colors.violet} />
              </Pressable>
            </View>
          </Reveal>

          <Reveal index={1} style={styles.statsRow}>
            <Pressable
              style={({ pressed }) => [styles.stat, pressed && { opacity: 0.88 }]}
              onPress={() => { if (!verified) navigation.navigate('VerifyBvn'); }}
            >
              <View style={[styles.statIcon, { backgroundColor: verified ? 'rgba(34,197,94,0.14)' : 'rgba(245,158,11,0.16)' }]}>
                <Feather name="shield" size={17} color={verified ? '#22C55E' : '#f59e0b'} />
              </View>
              <Text style={styles.statLabel}>BVN</Text>
              <Text style={[styles.statValue, { color: verified ? '#22C55E' : '#f59e0b' }]}>{verified ? 'Verified' : 'Not verified'}</Text>
            </Pressable>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(124,58,237,0.14)' }]}>
                <Feather name="credit-card" size={17} color={colors.violet} />
              </View>
              <Text style={styles.statLabel}>Naira account</Text>
              <Text style={styles.statValue}>{acctText}</Text>
            </View>
          </Reveal>

          {SECTIONS.concat([HELP]).map((sec) => {
            const idx = rowIndex++;
            return (
              <Reveal key={sec.title} index={idx}>
                <Text style={styles.sectionTitle}>{sec.title.toUpperCase()}</Text>
                <View style={styles.groupCard}>
                  {sec.rows.map((r, i) => {
                    const sub = r.key === 'VerifyBvn'
                      ? (verified ? 'Your BVN is verified' : 'Required for withdrawals, airtime and data')
                      : r.sub;
                    return (
                      <View key={r.key + (r.params ? '-r' : '')}>
                        <Pressable
                          style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                          onPress={() => navigation.navigate(r.key, r.params)}
                          android_ripple={{ color: 'rgba(124,58,237,0.12)' }}
                        >
                          <View style={[styles.iconTile, { backgroundColor: r.color + '22' }]}>
                            <Feather name={r.icon} size={18} color={r.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>{r.label}</Text>
                            {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
                          </View>
                          {r.key === 'Notifications' ? <NotificationBadge /> : null}
                          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                        </Pressable>
                        {i < sec.rows.length - 1 ? <View style={styles.divider} /> : null}
                      </View>
                    );
                  })}
                </View>
              </Reveal>
            );
          })}

          <Reveal index={rowIndex} style={{ marginTop: 22 }}>
            <Pressable style={({ pressed }) => [styles.signOutCard, pressed && { opacity: 0.88 }]} onPress={() => setConfirmOut(true)}>
              <View style={[styles.iconTile, { backgroundColor: 'rgba(248,113,113,0.15)' }]}>
                <Feather name="log-out" size={18} color="#f87171" />
              </View>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </Reveal>
        </View>
      </ScrollView>

      <Modal visible={confirmOut} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setConfirmOut(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(20,10,45,0.62)', justifyContent: 'flex-end' }} onPress={() => setConfirmOut(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 34, alignItems: 'center', shadowColor: SHADOW, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -8 }, elevation: 20 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(239,68,68,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="log-out" size={30} color="#ef4444" />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>Sign out?</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 21 }}>You will need to enter your email and password to sign back in.</Text>
            <Pressable onPress={() => { setConfirmOut(false); signOut(); }} style={({ pressed }) => ({ alignSelf: 'stretch', height: 54, borderRadius: 18, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', marginTop: 24, opacity: pressed ? 0.85 : 1, shadowColor: '#ef4444', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 })}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Sign out</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmOut(false)} style={({ pressed }) => ({ alignSelf: 'stretch', height: 54, borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 12, opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden', alignItems: 'center' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 14 },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#A78BFA', shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  verifiedDot: {
    position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#4C1D95',
  },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 12, paddingHorizontal: 30 },
  email: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3, paddingHorizontal: 30 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  kycText: { fontSize: 12, fontWeight: '800' },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  idBig: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: 2, flex: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.14)', borderRadius: 18, paddingHorizontal: 14, height: 38 },
  copyText: { color: colors.violet, fontSize: 13, fontWeight: '800' },
  editBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 22, padding: 14,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  statValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 3 },
  sectionTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 24, marginBottom: 10, marginLeft: 6 },
  groupCard: {
    backgroundColor: colors.bgCard, borderRadius: 24,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24 },
  iconTile: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 70, marginRight: 14 },
  signOutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)', padding: 14,
    shadowColor: '#f87171', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  signOutText: { color: '#f87171', fontSize: 15, fontWeight: '800' },
});
