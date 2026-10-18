import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import Ub3IdRow from './Ub3IdRow';

const SHADOW = '#2a1260';

const ROWS = [
  { key: 'Referral', label: 'Invite & Earn', icon: 'gift', color: '#fbbf24' },
  { key: 'VerifyBvn', label: 'Verify BVN', icon: 'shield', color: '#34d399' },
  { key: 'SecuritySettings', label: 'Security', icon: 'lock', color: '#60a5fa' },
  { key: 'PinSetup', label: 'Transaction PIN', icon: 'key', color: '#a78bfa' },
  { key: 'TransactionLimits', label: 'Transaction Limits', icon: 'sliders', color: '#60a5fa' },
  { key: 'Notifications', label: 'Notifications', icon: 'bell', color: '#a78bfa' },
];

function Reveal({ index, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index, 9) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user, signOut } = useAuth();
  const verified = user?.bvnVerified === true;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Reveal index={0} style={{ alignItems: 'center', width: '100%' }}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarGlow} />
            <LinearGradient
              colors={[colors.violet, colors.violetDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarLetter}>{(user?.email ?? 'U').charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            {verified && (
              <View style={styles.verifiedDot}>
                <Feather name="check" size={12} color="#fff" />
              </View>
            )}
          </View>
          {(user?.firstName || user?.lastName) ? (
            <Text style={styles.fullName}>{[user?.firstName, user?.lastName].filter(Boolean).join(' ')}</Text>
          ) : null}
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.kycBadge, { backgroundColor: verified ? 'rgba(16,185,129,0.14)' : 'rgba(250,204,21,0.18)' }]}>
            <Feather name={verified ? 'shield' : 'shield-off'} size={12} color={verified ? '#10b981' : '#ca8a04'} />
            <Text style={[styles.kycText, { color: verified ? '#10b981' : '#ca8a04' }]}>
              {verified ? 'Verified' : 'Unverified'}
            </Text>
          </View>

          <Ub3IdRow navigation={navigation} styles={styles} />
        </Reveal>
        <View style={{ height: spacing(6) }} />

        {ROWS.map((r, i) => (
          <Reveal key={r.key} index={i + 1} style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              onPress={() => navigation.navigate(r.key)}
              android_ripple={{ color: 'rgba(124,58,237,0.12)' }}
            >
              <View style={[styles.iconChip, { backgroundColor: r.color + '22', borderColor: r.color + '66' }]}>
                <Feather name={r.icon} size={17} color={r.color} />
              </View>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          </Reveal>
        ))}

        <View style={{ height: spacing(3) }} />

        <Reveal index={ROWS.length + 1} style={styles.signOutWrap}>
          <Pressable style={({ pressed }) => [styles.signOutCard, pressed ? styles.rowPressed : null]} onPress={signOut}>
            <View style={[styles.iconChip, { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.4)' }]}>
              <Feather name="log-out" size={17} color="#f87171" />
            </View>
            <Text style={[styles.rowLabel, { color: '#f87171' }]}>Sign out</Text>
          </Pressable>
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flexGrow: 1, padding: spacing(6), paddingBottom: spacing(28), alignItems: 'center' },
  avatarWrap: { width: 130, height: 130, marginTop: spacing(2), alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(124,58,237,0.16)' },
  avatar: {
    width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: colors.violet, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  avatarLetter: { color: '#fff', fontSize: 34, fontWeight: '800' },
  verifiedDot: {
    position: 'absolute', bottom: 21, right: 21, width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  email: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing(1) },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(1),
    marginTop: spacing(2), paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radii.pill,
  },
  kycText: { fontSize: 11, fontWeight: '700' },
  card: {
    width: '100%', backgroundColor: colors.bgCard, borderRadius: 22, marginVertical: spacing(1.5),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(4), borderRadius: 22 },
  rowPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  iconChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  signOutWrap: {
    width: '100%', borderRadius: 22,
    shadowColor: '#f87171', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  signOutCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing(3),
    backgroundColor: colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    padding: spacing(4),
  },
  fullName: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginTop: spacing(1) },
  uidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing(4) },
  uidLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  uidValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
