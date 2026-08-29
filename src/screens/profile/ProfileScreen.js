import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';

const ROWS = [
  { key: 'VerifyBvn', label: 'Verify BVN', icon: 'shield', color: '#34d399' },
  { key: 'SecuritySettings', label: 'Security', icon: 'lock', color: '#60a5fa' },
  { key: 'PinSetup', label: 'Transaction PIN', icon: 'key', color: '#a78bfa' },
  { key: 'WalletSettings', label: 'Operational wallets', icon: 'briefcase', color: '#34d399' },
];

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user, signOut } = useAuth();
  const verified = user?.bvnVerified === true;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.avatarWrap}>
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
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.kycBadge, { backgroundColor: verified ? '#0f2e22' : '#2e2a0f' }]}>
          <Feather name={verified ? 'shield' : 'shield-off'} size={12} color={verified ? '#34d399' : '#facc15'} />
          <Text style={[styles.kycText, { color: verified ? '#34d399' : '#facc15' }]}>
            {verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>

        <View style={{ height: spacing(7) }} />

        <View style={styles.card}>
          {ROWS.map((r, i) => (
            <Pressable
              key={r.key}
              style={[styles.row, i !== ROWS.length - 1 && styles.rowBorder]}
              onPress={() => navigation.navigate(r.key)}
            >
              <View style={[styles.iconChip, { backgroundColor: r.color + '22' }]}>
                <Feather name={r.icon} size={16} color={r.color} />
              </View>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: spacing(4) }} />

        <Pressable style={styles.signOutCard} onPress={signOut}>
          <View style={[styles.iconChip, { backgroundColor: '#2e0f14' }]}>
            <Feather name="log-out" size={16} color="#f87171" />
          </View>
          <Text style={[styles.rowLabel, { color: '#f87171' }]}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), alignItems: 'center' },
  avatarWrap: { marginTop: spacing(4) },
  avatar: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: '800' },
  verifiedDot: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#34d399', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  email: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: spacing(4) },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(1),
    marginTop: spacing(2), paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radii.pill,
  },
  kycText: { fontSize: 11, fontWeight: '700' },
  card: {
    width: '100%', backgroundColor: colors.bgCard, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(4) },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconChip: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  signOutCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing(3),
    backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: '#3a1a1f',
    padding: spacing(4),
  },
});
