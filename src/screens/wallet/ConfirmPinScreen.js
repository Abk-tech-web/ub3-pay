import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { withdrawFunds } from '../../services/walletService';
import PinGate from '../../components/PinGate';
import ProcessingOverlay from '../../components/ProcessingOverlay';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';

function genSessionId() {
  return Date.now() + '' + Math.floor(Math.random() * 1000000);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withdrawFee = (n) => (n < 20000 ? 20 : 10 * Math.floor(n / 10000) + 10);

const money = (n) => Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 });

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

export default function ConfirmPinScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { bank, accountNumber, accountName, amount } = route.params;
  const { adjustNgnBalance } = useWallet();
  const addActivity = () => {};
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [bvnBlocked, setBvnBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(true);
  const [pinErrCode, setPinErrCode] = useState('');
  const [phase, setPhase] = useState('idle');

  const fee = withdrawFee(Number(amount));
  const receive = Number(amount);
  const total = Number(amount) + fee;

  const onConfirm = async (pinValue) => {
    setPinErrCode('');
    setError('');
    if (!pinValue) return;
    setLoading(true);
    setPhase('processing');
    try {
      await withdrawFunds({
        uid: user.uid,
        amount,
        account_number: accountNumber,
        bank_code: bank.code,
        bank_name: bank.name,
        name: accountName,
        pin: pinValue,
      });
    } catch (err) {
      setLoading(false);
      setPhase('idle');
      if (['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'].includes(err.code || err.message)) {
        setPinErrCode(err.code || err.message);
      } else if (err.status === 403 && err.code === 'bvn_verification_required') {
        setGateOpen(false);
        setError('Please verify your BVN before withdrawing.');
        setBvnBlocked(true);
      } else {
        setGateOpen(false);
        setError(err.message || 'Withdrawal failed. Please try again.');
      }
      return;
    }
    setLoading(false);
    const sessionId = genSessionId();
    adjustNgnBalance(-amount);
    addActivity({
      id: 'act_' + Date.now(),
      label: 'Withdraw to ' + bank.name,
      at: new Date().toISOString(),
      status: 'success',
      amount,
      symbol: 'NGN',
      direction: 'out',
      bankName: bank.name,
      accountNumber,
      accountName,
      reference: sessionId,
    });
    setPhase('success');
    Vibration.vibrate([0, 70, 90, 70]);
    await wait(1300);
    navigation.replace('TransactionReceipt', {
      amountPrefix: '- NGN ',
      amount: money(total),
      topRightLabel: 'Bank',
      topRightIcon: 'business-outline',
      rows: [
        { label: 'Type', value: 'Bank Withdrawal' },
        { label: 'Sent to', value: accountName },
        { label: 'Receiver\u2019s Account', value: bank.name + ' (' + accountNumber + ')' },
        { label: 'Receiver gets', value: 'NGN ' + money(receive) },
        { label: 'Fee', value: 'NGN ' + money(fee) },
        { label: 'Total debited', value: 'NGN ' + money(total) },
        { label: 'Session ID', value: sessionId },
      ],
      date: new Date().toISOString(),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Reveal index={0} style={styles.headerRow}>
          <View style={styles.badge}>
            <Feather name="lock" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing(4) }}>
            <Text style={styles.title}>Confirm PIN</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Withdraw to {bank.name} {'\u00b7'} {accountNumber}
            </Text>
          </View>
        </Reveal>

        <Reveal index={1} style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroLabel}>You receive</Text>
          <Text style={styles.heroAmount}>NGN {money(receive)}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>{accountName}</Text>
        </Reveal>

        <Reveal index={2} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Account name</Text>
            <Text style={styles.value} numberOfLines={1}>{accountName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>NGN {money(amount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>NGN {money(fee)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Total from your balance</Text>
              <Text style={[styles.value, { color: VIOLET }]}>NGN {money(total)}</Text>
          </View>
        </Reveal>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {bvnBlocked ? (
          <Pressable onPress={() => navigation.navigate('VerifyBvn')} style={styles.verifyBtn}>
            <Feather name="shield" size={16} color={VIOLET} />
            <Text style={styles.verifyLink}>Verify now</Text>
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }} />

        <Reveal index={3}>
          <Pressable
            disabled={loading}
            onPress={() => { setPinErrCode(''); setGateOpen(true); }}
            style={({ pressed }) => [styles.cta, loading ? styles.ctaOff : null, pressed ? styles.pressed : null]}
          >
            <Feather name="check-circle" size={19} color="#fff" />
            <Text style={styles.ctaText}>Confirm</Text>
          </Pressable>
        </Reveal>
      </View>

      <PinGate
        visible={gateOpen}
        busy={loading}
        errorCode={pinErrCode}
        onSubmit={onConfirm}
        onCancel={() => setGateOpen(false)}
      />
      <ProcessingOverlay visible={phase !== 'idle'} phase={phase} title={phase === 'success' ? 'Withdrawal sent' : 'Processing withdrawal'} />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(6) },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(6) },
  badge: {
    width: 54, height: 54, borderRadius: 18, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  hero: {
    backgroundColor: '#4C1D95', borderRadius: 26, padding: spacing(5), marginBottom: spacing(4), overflow: 'hidden',
    shadowColor: SHADOW, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  heroGlow: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(167,139,250,0.28)', top: -80, right: -50,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  heroAmount: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: spacing(2) },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    paddingHorizontal: spacing(4), paddingVertical: spacing(2),
    shadowColor: SHADOW, shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing(3.5), gap: spacing(3) },
  divider: { height: 1, backgroundColor: 'rgba(124,58,237,0.12)' },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing(4) },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: spacing(3),
    backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 999, paddingHorizontal: spacing(4), paddingVertical: spacing(2.5),
  },
  verifyLink: { color: VIOLET, fontWeight: '800', fontSize: 14 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: VIOLET, borderRadius: 999, paddingVertical: spacing(4.5),
    shadowColor: VIOLET, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 10,
  },
  ctaOff: { opacity: 0.55 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
