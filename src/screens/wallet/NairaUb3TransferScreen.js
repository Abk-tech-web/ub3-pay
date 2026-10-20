import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Animated, Easing, Vibration } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { apiGet, apiPost } from '../../services/api';
import ConfirmationSheet from '../../components/ConfirmationSheet';
import PinGate from '../../components/PinGate';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import UB3Loader from '../../components/UB3Loader';

const SHADOW = '#2a1260';
const PIN_CODES = ['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'];
const money = (n) => '\u20A6' + (Number(n) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = (n) => '\u20A6' + Math.round(Number(n) || 0).toLocaleString('en-NG');
const pretty = (id) => (/^[0-9]{8}$/.test(id) ? id.slice(0, 4) + ' ' + id.slice(4) : '@' + id);

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380, delay: Math.min(index, 8) * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function NairaUb3TransferScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { portfolio, refreshPortfolio } = useWallet();

  const [id, setId] = useState((route.params && route.params.toUb3Id) || '');
  const [amount, setAmount] = useState('');
  const [lk, setLk] = useState({ state: 'idle', name: '' });
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinErrCode, setPinErrCode] = useState('');
  const [phase, setPhase] = useState('idle');
  const [perTx, setPerTx] = useState(1000000);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let alive = true;
    apiGet('/limits')
      .then((r) => { if (alive && r && r.limits && r.limits.ngn && r.limits.ngn.perTx) setPerTx(r.limits.ngn.perTx); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const idv = id.trim().replace(/^@/, '').toLowerCase();
  const looksValid = /^[a-z0-9_]{3,20}$/.test(idv);
  const bal = portfolio && portfolio.ngnBalance != null ? Number(portfolio.ngnBalance) : 0;
  const amt = Math.round((Number(amount) || 0) * 100) / 100;

  useEffect(() => {
    if (!looksValid) { setLk({ state: 'idle', name: '' }); return undefined; }
    let alive = true;
    setLk({ state: 'checking', name: '' });
    const t = setTimeout(() => {
      apiGet('/ub3id/lookup/' + encodeURIComponent(idv))
        .then((r) => {
          if (!alive) return;
          if (!r || !r.valid) setLk({ state: 'bad', name: '' });
          else if (r.isSelf) setLk({ state: 'self', name: '' });
          else setLk({ state: 'ok', name: r.displayName || idv });
        })
        .catch((e) => { if (alive) setLk({ state: e && e.status === 429 ? 'busy' : 'bad', name: '' }); });
    }, 650);
    return () => { alive = false; clearTimeout(t); };
  }, [idv]);

  const onAmount = (t) => {
    let v = t.replace(/[^0-9.]/g, '');
    const i = v.indexOf('.');
    if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2);
    setAmount(v);
    setError('');
  };

  const onMax = () => {
    const m = Math.floor(Math.min(bal, perTx) * 100) / 100;
    setAmount(m > 0 ? String(m) : '');
    setError('');
  };

  const canReview = lk.state === 'ok' && amt > 0;

  const onReview = () => {
    setError('');
    if (lk.state !== 'ok') return setError('Enter a valid UB3 ID first.');
    if (!(amt > 0)) return setError('Enter an amount greater than 0.');
    if (amt > perTx) return setError('The maximum per transfer is ' + whole(perTx) + '.');
    if (amt > bal) return setError('Insufficient balance. You have ' + money(bal) + '.');
    setConfirmVisible(true);
  };

  const doSend = async (pin) => {
    setPinErrCode('');
    setPinBusy(true);
    try {
      setPhase('processing');
      const res = await apiPost('/ngn-transfer', { toUb3Id: idv, amount: amt, pin });
      setPinBusy(false);
      setGateOpen(false);
      setConfirmVisible(false);
      setPhase('success');
      Vibration.vibrate([0, 70, 90, 70]);
      if (user) refreshPortfolio(user.uid);
      await new Promise((r) => setTimeout(r, 1300));
      setTimeout(() => setPhase('idle'), 700);
      const rows = [
        { label: 'To', value: ((res && res.recipientName) || lk.name) + ' (UB3 ID ' + pretty(idv) + ')', copyValue: idv },
        { label: 'Fee', value: 'Free' },
      ];
      if (res && res.reference) rows.push({ label: 'Reference', value: res.reference });
      const params = {
        amountPrefix: '- ',
        amount: 'NGN ' + amt.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        topRightLabel: 'UB3 ID transfer',
        topRightIcon: 'swap-horizontal-outline',
        rows,
        date: new Date().toISOString(),
        status: 'success',
      };
      try { navigation.replace('TransactionReceipt', params); } catch (e) { navigation.navigate('TransactionReceipt', params); }
    } catch (e) {
      setPhase('idle');
      setPinBusy(false);
      const c = (e && (e.code || e.message)) || '';
      if (PIN_CODES.includes(c)) { setPinErrCode(c); return; }
      setGateOpen(false);
      setConfirmVisible(false);
      if (e && !e.status) setError('We could not confirm this transfer. Please check your History before trying again.');
      else setError((e && e.message) || 'Transfer failed. Please try again.');
    }
  };

  const paste = async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (t) setId(t.trim());
    } catch (e) {}
  };

  const chip = () => {
    if (lk.state === 'checking') {
      return (
        <View style={styles.chipRow}>
          <UB3Loader size={20} color={colors.violet} />
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>Looking up UB3 ID...</Text>
        </View>
      );
    }
    if (lk.state === 'ok') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(34,197,94,0.14)' }]}>
          <Feather name="check-circle" size={14} color="#22C55E" />
          <Text style={[styles.chipText, { color: '#22C55E' }]}>{lk.name}</Text>
        </View>
      );
    }
    if (lk.state === 'bad' || lk.state === 'busy') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Feather name="x-circle" size={14} color={colors.danger} />
          <Text style={[styles.chipText, { color: colors.danger }]}>{lk.state === 'busy' ? 'Too many lookups. Wait a moment.' : 'UB3 ID not found'}</Text>
        </View>
      );
    }
    if (lk.state === 'self') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(245,158,11,0.16)' }]}>
          <Feather name="alert-triangle" size={14} color="#f59e0b" />
          <Text style={[styles.chipText, { color: '#f59e0b' }]}>That is your own UB3 ID</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.root}>
      <ProcessingOverlay visible={phase !== 'idle'} phase={phase} title={phase === 'success' ? 'Sent successfully' : 'Sending naira'} />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Send naira</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.iconCircle}>
            <Feather name="at-sign" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.heroBal} numberOfLines={1} adjustsFontSizeToFit>{money(bal)}</Text>
          <View style={styles.freePill}>
            <Feather name="zap" size={12} color="#fff" />
            <Text style={styles.freeText}>Free and instant to UB3 Pay users</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <Text style={styles.cardLabel}>Recipient UB3 ID</Text>
            <View style={styles.inputRow}>
              <Text style={styles.at}>@</Text>
              <TextInput
                style={styles.recipInput}
                value={id}
                onChangeText={(t) => { setId(t); setError(''); }}
                placeholder="UB3 ID of the person"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {id ? (
                <Pressable hitSlop={12} onPress={() => { setId(''); setError(''); }}>
                  <Feather name="x-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              ) : (
                <Pressable style={styles.pasteBtn} onPress={paste}>
                  <Feather name="clipboard" size={14} color="#fff" />
                  <Text style={styles.pasteText}>Paste</Text>
                </Pressable>
              )}
            </View>
            <View style={{ minHeight: 34, marginTop: 10 }}>{chip()}</View>
          </Reveal>

          <Reveal index={1} style={styles.card}>
            <Text style={styles.cardLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountSymbol}>{'\u20A6'}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={onAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.chips}>
              {[1000, 5000, 10000].map((n) => (
                <Pressable key={n} style={styles.pctChip} onPress={() => { setAmount(String(n)); setError(''); }}>
                  <Text style={styles.pctText}>{whole(n)}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.pctChip, styles.maxChip]} onPress={onMax}>
                <Text style={[styles.pctText, { color: '#fff' }]}>MAX</Text>
              </Pressable>
            </View>
            <Text style={styles.limitHint}>Up to {whole(perTx)} per transfer</Text>
          </Reveal>

          <Reveal index={2} style={styles.card}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Transfer fee</Text>
              <Text style={[styles.feeValue, { color: '#22C55E' }]}>Free</Text>
            </View>
          </Reveal>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={onReview}
            style={({ pressed }) => [styles.reviewBtn, !canReview && { opacity: 0.5 }, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.reviewText}>Review</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <ConfirmationSheet
        visible={confirmVisible}
        title="Send naira"
        icon="paper-plane"
        rows={[
          { label: 'To', value: lk.name + ' (UB3 ID ' + pretty(idv) + ')' },
          { label: 'Amount', value: money(amt) },
          { label: 'Fee', value: 'Free' },
          { label: 'Total', value: money(amt) },
        ]}
        onConfirm={() => { setPinErrCode(''); setGateOpen(true); }}
        onCancel={() => setConfirmVisible(false)}
        loading={pinBusy}
      />

      <PinGate
        visible={gateOpen}
        busy={pinBusy}
        errorCode={pinErrCode}
        onSubmit={doSend}
        onCancel={() => setGateOpen(false)}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden', alignItems: 'center' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroLabel: { color: '#ddd6fe', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroBal: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 6, paddingHorizontal: 30 },
  freePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  freeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 14, height: 54, marginTop: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  at: { color: colors.violet, fontSize: 18, fontWeight: '800' },
  recipInput: { flex: 1, color: colors.textPrimary, fontSize: 15, height: 54 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.violet, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  pasteText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipText: { fontSize: 12, fontWeight: '800' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 6 },
  amountSymbol: { color: colors.violet, fontSize: 30, fontWeight: '800' },
  amountInput: { color: colors.textPrimary, fontSize: 40, fontWeight: '800', minWidth: 120, textAlign: 'left', height: 62, padding: 0 },
  chips: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pctChip: { flex: 1, height: 40, borderRadius: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  maxChip: {
    backgroundColor: colors.violet, borderColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  pctText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  limitHint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 12 },
  feeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feeLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  feeValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 16 },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 58, borderRadius: 20, backgroundColor: colors.violet, marginTop: 20,
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  reviewText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
