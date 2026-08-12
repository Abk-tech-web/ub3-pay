import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function KycStatusScreen({ route }) {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    // TODO(integration): subscribe to kyc_records/{id} via Firestore listener
    // instead of a timeout — status changes when the vendor webhook resolves,
    // which can take seconds to a day depending on the review path.
    const t = setTimeout(() => setStatus('approved'), 2000);
    return () => clearTimeout(t);
  }, []);

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
          <PrimaryButton title="Go to wallet" onPress={() => setUser({ ...user, kycStatus: 'approved' })} />
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
