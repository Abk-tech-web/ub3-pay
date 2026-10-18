import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { useWallet } from '../../context/WalletContext';
import EmptyState from '../../components/EmptyState';
import AssetSelectCard from '../../components/AssetSelectCard';
import { formatCrypto } from '../../utils/formatters';

// Selling crypto for Naira is the same flow as the Swap tab's
// "crypto -> Naira" screen - this picker just gets the user there fast
// from an asset they already hold.
export default function SellCryptoScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { portfolio } = useWallet();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Feather name="trending-down" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing(4) }}>
          <Text style={styles.title}>Sell crypto</Text>
          <Text style={styles.subtitle}>Choose an asset to sell for Naira.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {portfolio.assets.length === 0 ? (
          <EmptyState title="Nothing to sell yet" subtitle="Deposit or buy crypto first." />
        ) : (
          portfolio.assets.map((a, i) => (
            <AssetSelectCard
              key={a.symbol + '-' + i}
              symbol={a.symbol}
              chainIds={[a.chainId]}
              iconChainId={a.chainId}
              right={formatCrypto(a.balance, '')}
              rightSub="available"
              index={i}
              onPress={() => navigation.navigate('SwapTab', { screen: 'Swap', params: { symbol: a.symbol } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(6), paddingTop: spacing(8), paddingBottom: spacing(5) },
  badge: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2a1260', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  scrollContent: { paddingHorizontal: spacing(5), paddingBottom: spacing(28) },
});
