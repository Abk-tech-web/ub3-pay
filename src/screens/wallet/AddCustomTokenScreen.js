import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function AddCustomTokenScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [contractAddress, setContractAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  const onAdd = async () => {
    // TODO(integration): look up token metadata (decimals, symbol, logo) from
    // the chain's RPC or a token-list API, then persist to wallets/{uid}/assets.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Add a custom token</Text>
        <Text style={styles.subtitle}>Paste a contract address to track a token not listed by default.</Text>

        <Text style={styles.label}>Contract address</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          value={contractAddress}
          onChangeText={setContractAddress}
        />

        <Text style={styles.label}>Symbol (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. SHIB"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          value={symbol}
          onChangeText={setSymbol}
        />

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Add token" onPress={onAdd} loading={loading} disabled={!contractAddress} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(2), marginBottom: spacing(8) },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(4),
    borderWidth: 1, borderColor: colors.border,
  },
});
