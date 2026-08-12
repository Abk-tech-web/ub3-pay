import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';

const ROWS = [
  { key: 'SecuritySettings', label: 'Security' },
  { key: 'PinSetup', label: 'Transaction PIN' },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(user?.email ?? 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.kycBadge}>
          <Text style={styles.kycText}>{user?.kycStatus === 'approved' ? 'Verified' : 'Unverified'}</Text>
        </View>

        <View style={{ height: spacing(8) }} />

        {ROWS.map((r) => (
          <Pressable key={r.key} style={styles.row} onPress={() => navigation.navigate(r.key)}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Pressable style={styles.row} onPress={signOut}>
          <Text style={[styles.rowLabel, { color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.violetSoft, fontSize: 28, fontWeight: '800' },
  email: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing(3) },
  kycBadge: { marginTop: spacing(2), paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radii.pill, backgroundColor: colors.bgElevated },
  kycText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(4), borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.textSecondary, fontSize: 18 },
});
