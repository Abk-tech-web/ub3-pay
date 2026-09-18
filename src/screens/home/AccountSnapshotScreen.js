import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { spacing, radii } from '../../config/theme';
import { getAvatarColor } from '../../utils/avatarColor';

const KYC_META = {
  approved: { label: 'Verified', color: '#34d399', bg: '#0f2e22', icon: 'shield' },
  pending: { label: 'Pending', color: '#facc15', bg: '#2e2a0f', icon: 'clock' },
  unverified: { label: 'Not Verified', color: '#facc15', bg: '#2e2a0f', icon: 'shield-off' },
};

export default function AccountSnapshotScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();

  const kycKey = user?.bvnVerified && user?.accountNumber ? 'approved' : user?.bvnVerified ? 'pending' : 'unverified';
  const kyc = KYC_META[kycKey];
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const displayName = fullName || user?.email || 'UB3 Pay User';
  const initial = (fullName || user?.email || 'U').charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(user?.uid);

  const copyUid = async () => {
    if (!user?.uid) return;
    await Clipboard.setStringAsync(user.uid);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>

        <Text style={styles.name}>{displayName}</Text>

        <View style={[styles.kycBadge, { backgroundColor: kyc.bg }]}>
          <Feather name={kyc.icon} size={12} color={kyc.color} />
          <Text style={[styles.kycText, { color: kyc.color }]}>{kyc.label}</Text>
        </View>

        <View style={styles.card}>
          <Pressable style={styles.row} onPress={copyUid} hitSlop={8}>
            <Text style={styles.rowLabel}>UB3 ID</Text>
            <View style={styles.rowValueWrap}>
              <Text style={styles.rowValue} numberOfLines={1}>{user?.uid || '—'}</Text>
              <Feather name="copy" size={13} color={colors.textSecondary} />
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => navigation.navigate('TransactionLimits')}>
            <Text style={styles.rowLabel}>Daily transaction limit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        {kycKey !== 'approved' && (
          <Text style={styles.hint}>
            {kycKey === 'pending'
              ? 'Your BVN is verified. Naira account setup is in progress.'
              : 'Verify your BVN to unlock withdrawals, airtime, and data.'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(5), paddingVertical: spacing(4),
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  body: { alignItems: 'center', paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
  avatar: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing(4),
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: spacing(4) },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(1),
    marginTop: spacing(2), paddingHorizontal: spacing(3), paddingVertical: spacing(1),
    borderRadius: radii.pill,
  },
  kycText: { fontSize: 11, fontWeight: '700' },
  card: {
    width: '100%', marginTop: spacing(7), backgroundColor: colors.bgCard,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing(4),
  },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  hint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: spacing(5), lineHeight: 18 },
});
