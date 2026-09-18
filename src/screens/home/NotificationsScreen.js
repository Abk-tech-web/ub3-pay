import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.bgElevated }]}>
        <Feather name="bell-off" size={28} color={colors.textSecondary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>No notifications yet</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        We'll let you know when something needs your attention.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing(4) },
  title: { fontSize: 16, fontWeight: '700', marginBottom: spacing(1) },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
