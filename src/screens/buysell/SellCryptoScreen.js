import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../config/theme';
import { useWallet } from '../../context/WalletContext';
import TokenIcon from '../../components/TokenIcon';
import EmptyState from '../../components/EmptyState';

// Selling crypto for Naira is the same flow as the Swap tab's
// "crypto → Naira" screen — this picker just gets the user there fast
// from an asset they already hold.
export default function SellCryptoScreen({ navigation }) {
  const { portfolio } = useWallet();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Sell crypto</Text>
        <Text style={styles.subtitle}>Choose an asset to sell for Naira.</Text>

        {portfolio.assets.length === 0 ? (
          <EmptyState title="Nothing to sell yet" subtitle="Deposit or buy crypto first." />
        ) : (
          portfolio.assets.map((a, i) => (
            <Pressable
              key={`${a.symbol}-${i}`}
              style={styles.row}
              onPress={() => navigation.navigate('SwapTab', { screen: 'SwapCryptoToNaira', params: { symbol: a.symbol } })}
            >
              <TokenIcon symbol={a.symbol} size={36} />
              <View style={{ flex: 1, marginLeft: spacing(3) }}>
                <Text style={styles.symbol}>{a.symbol}</Text>
                <Text style={styles.balance}>{a.balance} available</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(6) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  symbol: { color: colors.textPrimary, fontWeight: '700' },
  balance: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
