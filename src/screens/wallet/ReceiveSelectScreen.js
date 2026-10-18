import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { getGroupedTransferableAssets } from '../../config/chains';
import AssetSelectCard from '../../components/AssetSelectCard';

export default function ReceiveSelectScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Feather name="arrow-down-left" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing(4) }}>
          <Text style={styles.title}>Receive</Text>
          <Text style={styles.subtitle}>Choose which asset you're depositing.</Text>
        </View>
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: spacing(5), paddingBottom: spacing(28) }}
        data={groups}
        keyExtractor={(g) => g.symbol}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <AssetSelectCard
            symbol={item.symbol}
            chainIds={item.networks.map((n) => n.id)}
            index={index}
            onPress={() => handlePress(item)}
          />
        )}
      />
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
});
