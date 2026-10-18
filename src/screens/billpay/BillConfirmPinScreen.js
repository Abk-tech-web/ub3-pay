import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { NETWORKS, buyAirtime, buyData } from '../../services/billService';
import PinGate from '../../components/PinGate';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import NetworkIcon from '../../components/NetworkIcon';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';

function genSessionId() {
  return Date.now() + '' + Math.floor(Math.random() * 1000000);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export default function BillConfirmPinScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { kind, network, phone, amount, planLabel, planId } = route.params;
  const { user } = useAuth();
  const { adjustNgnBalance, addActivity } = useWallet();
  const [error, setError] = useState('');
  const [bvnBlocked, setBvnBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(true);
  const [pinErrCode, setPinErrCode] = useState('');
  const [phase, setPhase] = useState('idle');

  const networkObj = NETWORKS.find((n) => n.id === network);
  const formattedAmount = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const productLabel = kind === 'data' ? 'Mobile Data' : 'Airtime';

  const onConfirm = async (pinValue) => {
    setPinErrCode('');
    setError('');
    if (!pinValue) return;
    setLoading(true);
    setPhase('processing');
    try {
      if (kind === 'data') {
        await buyData(user.uid, network, phone, planId, pinValue);
      } else {
        await buyAirtime(user.uid, network, phone, amount, pinValue);
      }
      const sessionId = genSessionId();
      adjustNgnBalance(-amount);
      addActivity({
        id: 'act_' + Date.now(),
        label: (networkObj?.name || '') + (kind === 'data' ? ' Data' : ' Airtime'),
        at: new Date().toISOString(),
        status: 'success',
        amount,
        symbol: 'NGN',
        direction: 'out',
        network: networkObj?.name,
        phone,
        planLabel,
        reference: sessionId,
      });
      setPhase('success');
      Vibration.vibrate([0, 70, 90, 70]);
      await wait(1300);
      navigation.replace('TransactionReceipt', {
        dismissTo: kind === 'data' ? 'Data' : 'Airtime',
        amountPrefix: '- NGN ',
        amount: formattedAmount,
        topRightLabel: kind === 'data' ? 'Data' : 'Airtime',
        topRightIcon: 'phone-portrait-outline',
        rows: [
          { label: 'Type', value: kind === 'data' ? 'Mobile Data' : 'Airtime' },
          { label: 'Network', value: networkObj?.name },
          { label: 'Recipient', value: phone },
          ...(planLabel ? [{ label: 'Plan', value: planLabel }] : []),
          { label: 'Amount', value: 'NGN ' + formattedAmount },
          { label: 'Session ID', value: sessionId },
        ],
        date: new Date().toISOString(),
      });
    } catch (err) {
      setPhase('idle');
      if (['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'].includes(err.code || err.message)) {
        setPinErrCode(err.code || err.message);
      } else if (err.status === 403 && err.code === 'bvn_verification_required') {
        setGateOpen(false);
        setError('Please verify your BVN before making purchases.');
        setBvnBlocked(true);
      } else {
        setGateOpen(false);
        setError(err.message || 'Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.subtitle}>Enter your PIN to complete this purchase</Text>
          </View>
        </Reveal>

        <Reveal index={1} style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <NetworkIcon network={networkObj} size={30} />
            <View style={styles.pill}>
              <Text style={styles.pillText}>{productLabel}</Text>
            </View>
          </View>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryValue}>NGN {formattedAmount}</Text>
          <Text style={styles.summarySub} numberOfLines={1}>
            {planLabel ? planLabel + ' \u00b7 ' : ''}{phone}
          </Text>
        </Reveal>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {bvnBlocked ? (
          <Pressable onPress={() => navigation.navigate('VerifyBvn')} style={styles.verifyBtn}>
            <Feather name="shield" size={16} color={VIOLET} />
            <Text style={styles.verifyLink}>Verify now</Text>
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }} />

        <Reveal index={2}>
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
      <ProcessingOverlay visible={phase !== 'idle'} phase={phase} />
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
  summaryCard: {
    backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4), borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(4) },
  pill: { backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 999, paddingHorizontal: spacing(3), paddingVertical: 5 },
  pillText: { color: VIOLET, fontSize: 12, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  summarySub: { fontSize: 13, color: colors.textSecondary, marginTop: spacing(2) },
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
