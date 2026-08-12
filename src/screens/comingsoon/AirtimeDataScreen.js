import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';

export default function AirtimeDataScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming soon</Text>
        </View>
        <Text style={styles.title}>Airtime & data</Text>
        <Text style={styles.subtitle}>
          Buy airtime and mobile data straight from your Naira balance. UI is ready — wire up
          a VTU provider (VTpass/ClubKonnect) when this phase kicks off.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(12), alignItems: 'center' },
  badge: { backgroundColor: colors.bgCard, borderRadius: radii.pill, paddingHorizontal: spacing(4), paddingVertical: spacing(1.5), borderWidth: 1, borderColor: colors.border, marginBottom: spacing(5) },
  badgeText: { color: colors.violetSoft, fontSize: 11, fontWeight: '700' },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), textAlign: 'center' },
});
