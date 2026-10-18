import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function WithdrawSuccessScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { bank, accountNumber, accountName, amount } = route.params;
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(badge, { toValue: 1, friction: 4, tension: 90, delay: 200, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 1800, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const onDone = () => {
    navigation.popToTop();
  };

  const amountText = '\u20A6' + Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const rows = [
    { label: 'Bank', value: bank && bank.name },
    { label: 'Account Number', value: accountNumber },
    { label: 'Account Name', value: accountName },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.badgeWrap}>
            <Animated.View
              style={[
                styles.ring,
                {
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
                  transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                },
              ]}
            />
            <Animated.View style={[styles.badge, { transform: [{ scale: badge }] }]}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </Animated.View>
          </View>

          <Text style={styles.title}>Withdrawal Initiated</Text>
          <Text style={styles.amount}>{amountText}</Text>
          <Text style={styles.subtitle}>Your transfer request has been submitted for processing.</Text>

          <View style={styles.divider} />

          {rows.map((r, i) => (
            <View key={r.label} style={[styles.row, i === rows.length - 1 && { marginBottom: 0 }]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>{r.value}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <PrimaryButton title="Done" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 28, borderWidth: 1, borderColor: colors.border,
    padding: spacing(6), alignItems: 'center',
    shadowColor: '#2a1260', shadowOpacity: 0.22, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  badgeWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: spacing(4) },
  ring: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: '#16a34a' },
  badge: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#16a34a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0a5c2e', shadowOpacity: 0.45, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  amount: { fontSize: 34, fontWeight: '800', color: colors.violet, marginTop: spacing(2) },
  subtitle: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
    marginTop: spacing(2), marginBottom: spacing(5),
  },
  divider: { height: 1, backgroundColor: colors.border, width: '100%', marginBottom: spacing(4) },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: spacing(3),
  },
  rowLabel: { fontSize: 14, color: colors.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flexShrink: 1, marginLeft: spacing(4), textAlign: 'right' },
});
