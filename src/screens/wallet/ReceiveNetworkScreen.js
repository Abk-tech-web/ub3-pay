import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { getNetworksForSymbol } from '../../config/chains';
import TokenIcon from '../../components/TokenIcon';

export default function ReceiveNetworkScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { symbol } = route.params ?? {};
  const networks = getNetworksForSymbol(symbol);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Receive {symbol}</Text>
        <Text style={styles.subtitle}>Choose a network to deposit on.</Text>
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(6), paddingBottom: spacing(6) }}
        data={networks}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ReceiveAddress', { chainId: item.id, symbol })}
          >
            <TokenIcon symbol={item.symbol} size={38} />
            <View style={{ flex: 1, marginLeft: spacing(3) }}>
              <Text style={styles.symbol}>{item.name}</Text>
              <Text style={styles.chainName}>{item.standard ?? item.name}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(6), paddingTop: spacing(8), paddingBottom: spacing(4) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3) },
  symbol: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  chainName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 50 },
});
