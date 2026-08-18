import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../config/theme';

export default function SecuritySettingsScreen({ navigation }) {
  const [biometric, setBiometric] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Security</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Biometric unlock</Text>
          <Switch
            value={biometric}
            onValueChange={setBiometric}
            trackColor={{ true: colors.violet, false: colors.border }}
          />
        </View>

        <Pressable style={styles.row} onPress={() => navigation.navigate('PinSetup')}>
          <Text style={styles.rowLabel}>Change transaction PIN</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(6) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(4), borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.textSecondary, fontSize: 18 },
});
