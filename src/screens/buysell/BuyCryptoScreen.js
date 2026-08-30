import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function BuyCryptoScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Buy crypto with Naira</Text>
        <Text style={styles.subtitle}>
          This reuses the Naira → Crypto swap flow — fund your Naira account first, then swap.
        </Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton title="Fund Naira account" onPress={() => navigation.navigate('NairaTab', { screen: 'NairaAccount' })} />
        <View style={{ height: spacing(3) }} />
        <PrimaryButton title="Go to swap" variant="ghost" onPress={() => navigation.navigate('SwapTab', { screen: 'Swap', params: { symbol: 'NGN' } })} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2) },
});
