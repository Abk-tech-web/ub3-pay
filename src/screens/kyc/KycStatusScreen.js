import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import * as kycService from '../../services/kycService';

export default function KycStatusScreen() {
  const { user, refreshKycStatus } = useAuth();
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    // TODO(integration): subscribe to a Firestore listener on
    // kyc_records/{id} instead of a timeout+write — a real vendor
    // decision arrives via their webhook hitting a Cloud Function, not
    // the client deciding its own outcome. This mock intentionally takes
    // a few seconds since real review is never instant, but the decision
    // itself is still fake — no ID or face is actually being checked
    // until a licensed KYC vendor is wired into kycService.js.
    const t = setTimeout(async () => {
      if (user) await kycService.setKycStatus(user.uid, 'approved');
      setStatus('approved');
    }, 6000);
    return () => clearTimeout(t);
  }, [user]);

  const copy = {
    pending: { title: 'Reviewing your details', subtitle: 'This usually takes a few minutes.' },
    approved: { title: "You're verified", subtitle: 'Your wallet and Naira account are ready.' },
    rejected: { title: 'We couldn\u2019t verify you', subtitle: 'Check your details and try again, or contact support.' },
  }[status];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={[styles.badge, status === 'approved' && styles.badgeSuccess]} />
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <View style={{ flex: 1 }} />
        {status === 'approved' && (
          <PrimaryButton title="Go to wallet" onPress={refreshKycStatus} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: spacing(6), paddingTop: spacing(16), paddingBottom: spacing(6) },
  badge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.warning, marginBottom: spacing(6) },
  badgeSuccess: { borderColor: colors.success },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), textAlign: 'center' },
});
