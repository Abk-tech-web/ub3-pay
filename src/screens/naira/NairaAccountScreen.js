import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import * as baasService from '../../services/baasService';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function NairaAccountScreen({ navigation }) {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (user) baasService.getNairaAccount(user.uid).then(setAccount);
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Your Naira account</Text>
        <Text style={styles.subtitle}>Fund this account by bank transfer — it credits your balance automatically.</Text>

        <View style={styles.card}>
          {account ? (
            <>
              <Text style={styles.cardLabel}>Account number</Text>
              <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              <Text style={styles.cardLabel}>Bank</Text>
              <Text style={styles.cardValue}>{account.bankName}</Text>
              <Text style={styles.cardLabel}>Account name</Text>
              <Text style={styles.cardValue}>{account.accountName}</Text>
            </>
          ) : (
            <SkeletonLoader height={100} />
          )}
        </View>

        <Pressable
          style={styles.shareBtn}
          onPress={() => account && Share.share({ message: `${account.accountName} — ${account.accountNumber} — ${account.bankName}` })}
        >
          <Text style={styles.shareLabel}>Share account details</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('DepositHistory')} style={{ marginTop: spacing(6), alignSelf: 'center' }}>
          <Text style={styles.link}>View deposit history</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(6) },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing(5), borderWidth: 1, borderColor: colors.border },
  cardLabel: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(3) },
  cardValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 2 },
  accountNumber: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  shareBtn: { marginTop: spacing(5), backgroundColor: colors.violet, borderRadius: radii.pill, paddingVertical: spacing(3.5), alignItems: 'center' },
  shareLabel: { color: colors.bg, fontWeight: '700' },
  link: { color: colors.violetSoft, fontWeight: '600' },
});
