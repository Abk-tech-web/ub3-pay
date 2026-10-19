import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { getNetworksForSymbol } from '../../config/chains';
import AssetSelectCard from '../../components/AssetSelectCard';

export default function ReceiveNetworkScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { symbol } = route.params ?? {};
  const networks = getNetworksForSymbol(symbol);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Feather name="arrow-down-left" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing(4) }}>
          <Text style={styles.title}>Receive {symbol}</Text>
          <Text style={styles.subtitle}>Choose a network to deposit on.</Text>
        </View>
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(5), paddingBottom: spacing(28) }}
        data={networks}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <AssetSelectCard
            symbol={symbol}
            chainIds={[item.id]}
            iconChainId={item.id}
            index={index}
            onPress={() => navigation.navigate('ReceiveAddress', { chainId: item.id, symbol })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing(6), paddingTop: spacing(8), paddingBottom: spacing(5),
  },
  badge: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#5B21B6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2a1260', shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
