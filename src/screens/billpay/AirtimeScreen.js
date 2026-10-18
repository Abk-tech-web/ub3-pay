import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { NETWORKS } from '../../services/billService';
import { isPositiveAmount } from '../../utils/validators';
import { formatNgn } from '../../utils/formatters';
import NetworkIcon from '../../components/NetworkIcon';
import NetworkSelectorModal from '../../components/NetworkSelectorModal';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';
const QUICK_AMOUNTS = [50, 100, 200, 1000, 2000, 10000];

function Reveal({ index, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function AirtimeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const selectedNetwork = NETWORKS.find((n) => n.id === network);
  const amountOk = isPositiveAmount(amount);

  const onBuy = () => {
    setError('');
    if (phone.length < 10) return setError('Enter a valid phone number.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount.');
    navigation.navigate('ConfirmPurchase', {
      kind: 'airtime',
      network,
      phone,
      amount: parseFloat(amount),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Airtime</Text>
        <Pressable onPress={() => navigation.navigate('ActivityTab', { screen: 'ActivityList' })} hitSlop={12}>
          <Text style={styles.headerLink}>History</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Reveal index={0} style={styles.selectorCard}>
          <Pressable style={styles.selectorLeft} onPress={() => setModalVisible(true)}>
            <NetworkIcon network={selectedNetwork} size={36} />
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginHorizontal: spacing(1) }} />
          </Pressable>
          <View style={styles.divider} />
          <TextInput
            style={styles.phoneInput}
            placeholder="e.g 906******"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </Reveal>

        <Reveal index={1} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardBadge}>
              <Feather name="phone-call" size={16} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>Select amount</Text>
          </View>
          <View style={styles.amountGrid}>
            {QUICK_AMOUNTS.map((a) => {
              const active = amount === String(a);
              return (
                <Pressable
                  key={a}
                  style={({ pressed }) => [styles.amountTile, active ? styles.amountTileActive : null, pressed ? styles.pressed : null]}
                  onPress={() => setAmount(String(a))}
                >
                  <Text style={[styles.amountValue, active ? styles.amountTextActive : null]}>{formatNgn(a)}</Text>
                  <Text style={[styles.amountPay, active ? styles.amountPayActive : null]}>Pay {formatNgn(a)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.orLabel}>Or enter an amount</Text>
          <View style={styles.customRow}>
            <Text style={styles.nairaSign}>{'\u20A6'}</Text>
            <TextInput
              style={styles.customInput}
              placeholder="50-500,000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </Reveal>
        <View style={{ height: spacing(4) }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!amountOk}
          onPress={onBuy}
          style={({ pressed }) => [styles.cta, !amountOk ? styles.ctaOff : null, pressed ? styles.pressed : null]}
        >
          <Feather name="zap" size={19} color="#fff" />
          <Text style={styles.ctaText}>{amountOk ? 'Pay ' + formatNgn(parseFloat(amount)) : 'Pay'}</Text>
        </Pressable>
      </View>

      <NetworkSelectorModal
        visible={modalVisible}
        networks={NETWORKS}
        selectedId={network}
        onSelect={setNetwork}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(4), paddingTop: spacing(2), paddingBottom: spacing(3) },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  headerLink: { color: VIOLET, fontSize: 15, fontWeight: '700' },
  scroll: { padding: spacing(4), paddingTop: spacing(1) },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
  selectorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)', paddingHorizontal: spacing(3), height: 64, marginBottom: spacing(4),
    shadowColor: SHADOW, shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 26, backgroundColor: 'rgba(124,58,237,0.2)', marginHorizontal: spacing(3) },
  phoneInput: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)', padding: spacing(4),
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(4) },
  cardBadge: {
    width: 32, height: 32, borderRadius: 11, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3),
  },
  cardLabel: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(4) },
  amountTile: {
    width: '31.5%', backgroundColor: colors.bg, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.16)',
    paddingVertical: spacing(3.5), alignItems: 'center',
  },
  amountTileActive: {
    backgroundColor: VIOLET, borderColor: VIOLET,
    shadowColor: VIOLET, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  amountValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  amountPay: { color: colors.textSecondary, fontSize: 11, marginTop: spacing(1) },
  amountTextActive: { color: '#fff' },
  amountPayActive: { color: 'rgba(255,255,255,0.8)' },
  orLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: spacing(2), marginLeft: spacing(1) },
  customRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 18, borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.16)', paddingHorizontal: spacing(4), height: 56,
  },
  nairaSign: { color: VIOLET, fontSize: 20, fontWeight: '800', marginRight: spacing(2) },
  customInput: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  footer: { padding: spacing(4), paddingBottom: spacing(6) },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: VIOLET, borderRadius: 999, paddingVertical: spacing(4.5),
    shadowColor: VIOLET, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 10,
  },
  ctaOff: { opacity: 0.45, shadowOpacity: 0.1, elevation: 2 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
