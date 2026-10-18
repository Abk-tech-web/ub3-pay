import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { useWallet } from '../../context/WalletContext';
import { formatNgn } from '../../utils/formatters';
import { NETWORKS } from '../../services/billService';
import NetworkIcon from '../../components/NetworkIcon';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';

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

function DetailRow({ styles, label, value, last, icon }) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueWrap}>
          {icon}
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
      {last ? null : <View style={styles.divider} />}
    </View>
  );
}

export default function ConfirmPurchaseScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { kind, network, phone, amount, planLabel, planId } = route.params;
  const networkObj = NETWORKS.find((n) => n.id === network);
  const { portfolio } = useWallet();
  const balance = portfolio?.ngnBalance ?? 0;
  const insufficient = balance < amount;

  const productLabel = kind === 'data' ? 'Mobile Data' : 'Airtime';

  const onProceed = () => {
    navigation.navigate('BillConfirmPin', { kind, network, phone, amount, planLabel, planId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Reveal index={0} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <NetworkIcon network={networkObj} size={34} />
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{productLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroLabel}>You are paying</Text>
          <Text style={styles.heroAmount}>{formatNgn(amount)}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {planLabel ? planLabel + ' \u00b7 ' : ''}{phone}
          </Text>
        </Reveal>

        <Reveal index={1} style={styles.card}>
          <DetailRow
            styles={styles}
            label="Product"
            value={productLabel}
            icon={<NetworkIcon network={networkObj} size={20} />}
          />
          <DetailRow styles={styles} label="Recipient" value={phone} />
          {planLabel ? <DetailRow styles={styles} label="Plan" value={planLabel} /> : null}
          <DetailRow styles={styles} label="Amount" value={formatNgn(amount)} last />
        </Reveal>

        <Reveal index={2} style={[styles.balanceCard, insufficient ? styles.balanceCardBad : null]}>
          <View style={[styles.balanceIcon, insufficient ? styles.balanceIconBad : null]}>
            <Feather name="credit-card" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={[styles.balanceValue, insufficient ? styles.balanceInsufficient : null]}>
              {formatNgn(balance)}
            </Text>
            {insufficient ? <Text style={styles.insufficientText}>Insufficient balance. Fund your Naira account first.</Text> : null}
          </View>
        </Reveal>

        <View style={{ flex: 1 }} />

        <Reveal index={3}>
          <Pressable
            disabled={insufficient}
            onPress={onProceed}
            style={({ pressed }) => [styles.cta, insufficient ? styles.ctaOff : null, pressed ? styles.pressed : null]}
          >
            <Feather name="lock" size={18} color="#fff" />
            <Text style={styles.ctaText}>Proceed</Text>
          </Pressable>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(4), paddingTop: spacing(4), paddingBottom: spacing(6) },
  hero: {
    backgroundColor: '#4C1D95', borderRadius: 26, padding: spacing(5), marginBottom: spacing(4), overflow: 'hidden',
    shadowColor: SHADOW, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  heroGlow: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(167,139,250,0.28)', top: -90, right: -60,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(5) },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: spacing(3), paddingVertical: 5 },
  heroPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  heroAmount: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: spacing(2) },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    paddingHorizontal: spacing(4), paddingVertical: spacing(2), marginBottom: spacing(4),
    shadowColor: SHADOW, shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing(3.5) },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), flexShrink: 1 },
  divider: { height: 1, backgroundColor: 'rgba(124,58,237,0.12)' },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  balanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  balanceCardBad: { borderColor: 'rgba(239,68,68,0.4)' },
  balanceIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center' },
  balanceIconBad: { backgroundColor: '#DC2626' },
  balanceLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 2 },
  balanceInsufficient: { color: colors.danger },
  insufficientText: { color: colors.danger, fontSize: 12, marginTop: spacing(1) },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: VIOLET, borderRadius: 999, paddingVertical: spacing(4.5),
    shadowColor: VIOLET, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 10,
  },
  ctaOff: { opacity: 0.45, shadowOpacity: 0.1, elevation: 2 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
