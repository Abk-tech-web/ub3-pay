import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';
import { getGroupedTransferableAssets } from '../../config/chains';
import TokenIcon from '../../components/TokenIcon';

export default function ReceiveSelectScreen({ navigation }) {
  const groups = getGroupedTransferableAssets();

  const handlePress = (group) => {
    if (group.networks.length === 1) {
      navigation.navigate('ReceiveAddress', { chainId: group.networks[0].id, symbol: group.symbol });
    } else {
      navigation.navigate('NetworkPicker', {
        symbol: group.symbol,
        networks: group.networks,
        targetRoute: 'ReceiveAddress',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Receive</Text>
        <Text style={styles.subtitle}>Choose which asset you're depositing.</Text>
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(6), paddingBottom: spacing(6) }}
        data={groups}
        keyExtractor={(g) => g.symbol}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => handlePress(item)}
          >
            <TokenIcon symbol={item.symbol} size={38} />
            <View style={{ flex: 1, marginLeft: spacing(3) }}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.chainName}>
                {item.networks.length === 1 ? item.networks[0].name : `${item.networks.length} networks`}
              </Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(6), paddingTop: spacing(8), paddingBottom: spacing(4) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3) },
  symbol: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  chainName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 50 },
});
