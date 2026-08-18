import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as walletConfigService from '../../services/walletConfigService';

// Operational wallet configuration. Saving an address here only stores a
// reference on this device — it does NOT connect a signing key or move
// real funds. Real fund routing (revenue actually landing in this wallet,
// buys/sells actually settling against the liquidity wallet) requires a
// wallet-infra/custody provider wired into walletService.js first.
export default function WalletSettingsScreen() {
  const [revenueWallet, setRevenueWallet] = useState('');
  const [liquidityWallet, setLiquidityWallet] = useState('');
  const [nairaAccount, setNairaAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    walletConfigService.getWalletConfig().then((cfg) => {
      setRevenueWallet(cfg.revenueWallet);
      setLiquidityWallet(cfg.liquidityWallet);
      setNairaAccount(cfg.nairaAccount);
    });
  }, []);

  const onSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await walletConfigService.setRevenueWallet(revenueWallet);
      await walletConfigService.setLiquidityWallet(liquidityWallet);
      await walletConfigService.setNairaSettlementAccount(nairaAccount);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Operational wallets</Text>
        <Text style={styles.subtitle}>
          These addresses are configuration only — connecting real fund
          movement (revenue actually settling here, swaps actually pulling
          from the liquidity wallet) still requires a wallet-custody
          provider wired into the backend.
        </Text>

        <Text style={styles.label}>Revenue wallet address</Text>
        <Text style={styles.hint}>Receives margin from swaps and the $0.10 withdrawal fee.</Text>
        <TextInput
          style={styles.input}
          placeholder="0x... or chain address"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          value={revenueWallet}
          onChangeText={setRevenueWallet}
        />

        <Text style={styles.label}>Liquidity wallet address</Text>
        <Text style={styles.hint}>The pool crypto buy/sell orders settle against.</Text>
        <TextInput
          style={styles.input}
          placeholder="0x... or chain address"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          value={liquidityWallet}
          onChangeText={setLiquidityWallet}
        />

        <Text style={styles.label}>Naira settlement account</Text>
        <Text style={styles.hint}>Bank account NGN volume settles to.</Text>
        <TextInput
          style={styles.input}
          placeholder="Account number / bank"
          placeholderTextColor={colors.textSecondary}
          value={nairaAccount}
          onChangeText={setNairaAccount}
        />

        {saved ? <Text style={styles.savedNote}>Saved on this device.</Text> : null}
        <PrimaryButton title="Save" onPress={onSave} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(2), marginBottom: spacing(6), lineHeight: 19 },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: spacing(1) },
  hint: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing(2) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(5), borderWidth: 1, borderColor: colors.border,
  },
  savedNote: { color: colors.success, fontSize: 13, marginBottom: spacing(3), textAlign: 'center' },
});
