import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function WithdrawSuccessScreen({ navigation, route }) {
  const { bank, accountNumber, accountName, amount } = route.params;
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onDone = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Animated.View
          style={[
            styles.card,
            { opacity, transform: [{ scale }] },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={36} color="#008751" />
          </View>
          <Text style={styles.title}>Withdrawal Initiated</Text>
          <Text style={styles.subtitle}>
            Your transfer request has been submitted for processing.
          </Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Bank</Text>
            <Text style={styles.rowValue}>{bank.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Account Number</Text>
            <Text style={styles.rowValue}>{accountNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Account Name</Text>
            <Text style={styles.rowValue}>{accountName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Amount</Text>
            <Text style={styles.rowValue}>NGN {amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <PrimaryButton title="Done" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(6),
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(4),
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing(2),
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing(5),
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginBottom: spacing(4),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing(3),
  },
  rowLabel: { fontSize: 14, color: colors.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
