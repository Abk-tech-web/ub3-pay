import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useWallet } from '../../context/WalletContext';

function Reveal({ delay = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

export default function WithdrawAmountScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { bank, accountNumber, accountName } = route.params;
  const { portfolio } = useWallet();
  const ngnBalance = portfolio.ngnBalance;
  const [amount, setAmount] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const overBalance = numericAmount > (ngnBalance ?? 0);
  const canContinue = numericAmount > 0 && numericAmount <= (ngnBalance ?? 0);

  const onMax = () => {
    setAmount(String(ngnBalance ?? 0));
  };

  const onContinue = () => {
    navigation.navigate('ConfirmPin', {
      bank,
      accountNumber,
      accountName,
      amount: numericAmount,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Amount</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.body}>
        <Reveal delay={0}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroRow}>
              {bank && bank.logo ? (
                <Image source={{ uri: bank.logo }} style={styles.heroLogo} />
              ) : (
                <View style={styles.heroLogoFallback}>
                  <Ionicons name="business-outline" size={20} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Withdrawing to</Text>
                <Text style={styles.heroValue} numberOfLines={1}>
                  {bank.name} {'\u2022'} {accountNumber}
                </Text>
                {accountName ? (
                  <Text style={styles.heroName} numberOfLines={1}>{accountName}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </Reveal>

        <Reveal delay={100}>
          <Text style={styles.label}>Amount (NGN)</Text>
          <View style={styles.amountCard}>
            <Text style={styles.naira}>{'\u20A6'}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Pressable style={styles.maxButton} onPress={onMax}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </Pressable>
          </View>
          <Text style={[styles.balanceHint, overBalance && { color: colors.danger, fontWeight: '700' }]}>
            {overBalance
              ? 'Amount is more than your balance'
              : 'Available: ' + '\u20A6' + (ngnBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        </Reveal>

        <View style={{ flex: 1 }} />

        <PrimaryButton title="Continue" onPress={onContinue} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(4), paddingVertical: spacing(3),
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(3) },
  hero: {
    backgroundColor: '#4C1D95', borderRadius: 26, padding: spacing(5),
    overflow: 'hidden', marginBottom: spacing(6),
    shadowColor: '#2a1260', shadowOpacity: 0.35, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  heroGlow: {
    position: 'absolute', top: -50, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroLogo: { width: 46, height: 46, borderRadius: 23, marginRight: 14, backgroundColor: '#fff' },
  heroLogoFallback: {
    width: 46, height: 46, borderRadius: 23, marginRight: 14, backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.4 },
  heroValue: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 3 },
  heroName: { fontSize: 13, color: '#C4B5FD', marginTop: 3, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing(2) },
  amountCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing(4), height: 78,
    shadowColor: '#2a1260', shadowOpacity: 0.2, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  naira: { fontSize: 30, fontWeight: '800', color: colors.violet, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '800', color: colors.textPrimary, padding: 0 },
  maxButton: {
    backgroundColor: colors.violet, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18,
    shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  maxButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  balanceHint: { fontSize: 13, color: colors.textSecondary, marginTop: spacing(3), marginLeft: 4 },
});
