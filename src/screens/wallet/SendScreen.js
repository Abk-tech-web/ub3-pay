import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Vibration, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmationSheet from '../../components/ConfirmationSheet';
import FloatingInput from '../../components/FloatingInput';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as walletService from '../../services/walletService';
import { getUsdPrice } from '../../services/rateService';
import { getMarginUsd, tierFeeUsd } from '../../services/feeService';
import { isPositiveAmount } from '../../utils/validators';
import { truncateAddress, formatUsd } from '../../utils/formatters';
import PinPad from '../../components/PinPad';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import ForgotPinModal from '../../components/ForgotPinModal';
import { apiGet } from '../../services/api';
import { getChain } from '../../config/chains';
import AssetIcon from '../../components/AssetIcon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function SendScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { chainId = 'bitcoin', symbol = 'BTC' } = route.params ?? {};
  const { user } = useAuth();
  const { adjustCryptoBalance, addActivity, portfolio, refreshPortfolio } = useWallet();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isMax, setIsMax] = useState(false);
  const [pinMode, setPinMode] = useState(null);
  const [pinError, setPinError] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [fee, setFee] = useState(null);
  const [ub3Recipient, setUb3Recipient] = useState(null);

  const justAppliedAddress = useRef(false);
  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(enter, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start(); }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.selectedAddress) {
        justAppliedAddress.current = true;
        setAddress(route.params.selectedAddress);
        setError('');
        navigation.setParams({ selectedAddress: undefined });
      } else if (justAppliedAddress.current) {
        justAppliedAddress.current = false;
      } else {
        setAddress('');
        setAmount('');
        setError('');
        setFee(null);
      }
    }, [route.params?.selectedAddress])
  );
  const [usdRate, setUsdRate] = useState(null);

  useEffect(() => {
    let active = true;
    getUsdPrice(symbol)
      .then((rate) => { if (active) setUsdRate(rate); })
      .catch(() => { if (active) setUsdRate(null); });
    return () => { active = false; };
  }, [symbol]);

  const amountUsd = usdRate && amount ? Number(amount) * usdRate : null;
  const FEE_RESERVE = { SOL: 0.00001, BTC: 0.00005, ETH: 0.00005, BNB: 0.00005, MATIC: 0.005, AVAX: 0.001, TRX: 1, TON: 0.05, ADA: 1, LTC: 0.0001, XRP: 1, SUI: 0.01 };
  const heldAsset = ((portfolio && portfolio.assets) || []).find((a) => a.symbol === symbol && a.chainId === chainId);
  const available = heldAsset ? parseFloat(heldAsset.balance) || 0 : null;
  const trim = (n, d) => n.toFixed(d).replace(/\.?0+$/, '');
  const availText = available === null ? null : trim(available, 6);
  const feeBasisUsd = amountUsd !== null
    ? amountUsd
    : (available !== null && usdRate ? available * usdRate : null);
  const isUb3Id = chainId === 'solana' && symbol === 'SOL' && /^[a-z0-9_]{3,20}$/.test(address.trim().replace(/^@/, '').toLowerCase());
  const serviceFee = isUb3Id ? 0 : (usdRate && feeBasisUsd !== null) ? tierFeeUsd(feeBasisUsd) / usdRate : 0;
  const needed = Number(amount) + serviceFee + (FEE_RESERVE[symbol] || 0);
  const insufficient = available !== null && amount !== '' && needed > available + 1e-6;
  const insufficientMsg = 'Insufficient balance. You have ' + availText + ' ' + symbol + ', but the amount plus ' + (isUb3Id ? 'the network reserve' : 'the service fee') + ' needs about ' + trim(needed, 6) + ' ' + symbol + '.';
  const onMax = () => {
    if (available === null) return;
    const raw = Math.max(0, available - serviceFee - (FEE_RESERVE[symbol] || 0));
    const floored = Math.floor(raw * 1e8) / 1e8;
    setAmount(trim(floored, 8));
    setIsMax(true);
  };

  const onReview = async () => {
    setError('');
    const idValue = address.trim().replace(/^@/, '').toLowerCase();
    if (/^[a-z0-9_]{3,20}$/.test(idValue)) {
      if (chainId !== 'solana' || symbol !== 'SOL') return setError('UB3 ID transfers are available for SOL for now.');
      if (!isPositiveAmount(amount)) return setError('Enter an amount greater than 0.');
      if (insufficient) return setError(insufficientMsg);
      try {
        const r = await apiGet('/ub3id/lookup/' + encodeURIComponent(idValue));
        if (!r || !r.valid) return setError('UB3 ID not found.');
        if (r.isSelf) return setError('You cannot send to your own UB3 ID.');
        const f = await walletService.estimateNetworkFee(chainId);
        setFee(f);
        setUb3Recipient({ id: idValue, name: r.displayName || idValue });
        setConfirmVisible(true);
      } catch (e) {
        setError((e && e.message) ? e.message : 'Something went wrong. Please try again.');
      }
      return;
    }
    setUb3Recipient(null);
    if (!address.trim()) return setError('Enter the recipient address.');
    if (!(await walletService.validateAddress(chainId, address))) return setError('That address doesn\u2019t look right for this network.');
    if (!isPositiveAmount(amount)) return setError('Enter an amount greater than 0.');
    if (insufficient) return setError(insufficientMsg);
    try {
      const f = await walletService.estimateNetworkFee(chainId);
      setFee(f);
      setConfirmVisible(true);
    } catch (e) {
      setError((e && e.message) ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const onConfirm = async () => {
    try {
      const s = await walletService.getPinStatus();
      setPinError('');
      setFirstPin('');
      setPinMode(s.hasPin ? 'enter' : 'create');
    } catch (e) {
      setConfirmVisible(false); setError('Could not start the PIN check. Please try again.');
    }
  };

  const handlePinError = (code) => {
    if (code === 'PIN_LOCKED') setPinError('Too many wrong attempts. Try again in 15 minutes.');
    else if (code === 'PIN_NOT_SET') { setPinError(''); setPinMode('create'); }
    else setPinError('Wrong PIN. Try again.');
  };

  const onPinComplete = async (pin) => {
    if (pinMode === 'enter') return doSend(pin);
    if (pinMode === 'create') { setFirstPin(pin); setPinError(''); setPinMode('confirm'); return; }
    if (pinMode === 'confirm') {
      if (pin !== firstPin) { setPinError('PINs do not match. Start again.'); setFirstPin(''); setPinMode('create'); return; }
      setPinBusy(true);
      try { await walletService.setPin(pin); }
      catch (e) { setPinBusy(false); setPinError(e.message || 'Could not save PIN'); return; }
      setPinBusy(false);
      return doSend(pin);
    }
  };

  const doSend = async (pin) => {
    setSending(true);
    try {
      setPhase('processing');
      const result = await walletService.sendCrypto(user.uid, chainId, symbol, ub3Recipient ? '' : address, amount, isMax, pin, ub3Recipient ? ub3Recipient.id : undefined);
      adjustCryptoBalance(symbol, -Number(amount));
      if (refreshPortfolio) refreshPortfolio();
      setConfirmVisible(false);
      setPinMode(null);
      setPhase('success');
      Vibration.vibrate([0, 70, 90, 70]);
      await new Promise((resolve) => setTimeout(resolve, 1300));
      setTimeout(() => setPhase('idle'), 700);
      navigation.navigate('TransactionReceipt', {
        amountPrefix: '-',
        amount: `${amount} ${symbol}`,
        topRightLabel: 'Sent',
        rows: [
          { label: 'To', value: ub3Recipient ? (ub3Recipient.name + ' (' + ub3Recipient.id + ')') : truncateAddress(address) },
          { label: 'Network', value: chainId },
          { label: 'Amount', value: `${amount} ${symbol}` },
          { label: 'Network fee', value: fee ? formatUsd(fee.networkFeeUsd) : '...' },
        ],
        date: new Date().toISOString(),
      });
    } catch (e) {
    setPhase('idle');
      if (['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'].includes(e.message)) { handlePinError(e.message); } else { setConfirmVisible(false); setPinMode(null); setError(e.message || "Send failed"); }
    } finally {
      setSending(false);
    }
  };

  const chainInfo = getChain(chainId);
  const chainName = (chainInfo && chainInfo.name) || chainId;
  const canReview = !!address.trim() && !!amount;
  const serviceFeeText = isUb3Id ? 'Free' : (usdRate && serviceFee > 0 ? formatUsd(serviceFee * usdRate) : '-');
  const errMsg = insufficient ? insufficientMsg : error;
  const setPct = (p) => {
    if (available === null) return;
    const raw = Math.max(0, available * p);
    setAmount(trim(Math.floor(raw * 1e8) / 1e8, 8));
    setIsMax(false);
    setError('');
  };

  return (
    <View style={styles.root}>
      <ForgotPinModal
        visible={forgotOpen}
        onClose={() => { setForgotOpen(false); setPinError(''); setPinMode('enter'); }}
        onDone={() => { setForgotOpen(false); setPinError(''); setPinMode('enter'); }}
      />
      <PinPad
        visible={!!pinMode}
        title={pinMode === 'enter' ? 'Enter PIN' : pinMode === 'create' ? 'Create a PIN' : 'Confirm your PIN'}
        subtitle={pinMode === 'enter' ? 'Enter your 4-digit PIN to approve this payment' : pinMode === 'create' ? 'Choose a 4-digit PIN to protect your payments' : 'Enter the PIN again to confirm'}
        error={pinError}
        busy={sending || pinBusy}
        onForgot={pinMode === 'enter' ? () => { setPinMode(null); setPinError(''); setForgotOpen(true); } : undefined}
        onComplete={onPinComplete}
        onCancel={() => { setPinMode(null); setPinError(''); setFirstPin(''); }}
      />
      <ProcessingOverlay visible={phase !== 'idle'} phase={phase} title={phase === 'success' ? 'Sent successfully' : 'Sending payment'} />

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
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Send</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.assetRing}>
            <AssetIcon kind="crypto" symbol={symbol} size={52} />
          </View>
          <Text style={styles.heroAsset}>Send {symbol}</Text>
          <View style={styles.netPill}>
            <View style={styles.netDot} />
            <Text style={styles.netText}>{chainName}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <Text style={styles.cardLabel}>Recipient</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.recipInput}
                value={address}
                onChangeText={(t) => { setAddress(t); setError(''); setUb3Recipient(null); }}
                placeholder={symbol === 'SOL' ? 'SOL address or UB3 ID' : symbol + ' address'}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {address ? (
                <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={() => { setAddress(''); setError(''); setUb3Recipient(null); }}>
                  <Feather name="x-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.pasteBtn}
                  onPress={async () => { try { const t = await Clipboard.getStringAsync(); if (t) { setAddress(t.trim()); setError(''); setUb3Recipient(null); } } catch (e) {} }}
                >
                  <Feather name="clipboard" size={14} color="#fff" />
                  <Text style={styles.pasteText}>Paste</Text>
                </TouchableOpacity>
              )}
            </View>
            {isUb3Id ? (
              <View style={styles.idChip}>
                <Feather name="check-circle" size={14} color="#22C55E" />
                <Text style={styles.idChipText}>UB3 ID detected {'\u00B7'} free transfer</Text>
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SelectRecipient', { targetRoute: 'SendAmount', chainId, symbol })}
              style={styles.savedRow}
            >
              <View style={styles.savedIcon}>
                <Feather name="users" size={17} color={colors.violet} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.savedTitle}>Saved & Recent</Text>
                <Text style={styles.savedSub}>Favourites and people you have sent to</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </Reveal>

          <Reveal index={1} style={styles.card}>
            <View style={styles.amountTop}>
              <Text style={styles.cardLabel}>Amount</Text>
              {availText !== null ? <Text style={styles.availText}>Available: {availText} {symbol}</Text> : null}
            </View>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => { setAmount(t); setError(''); setIsMax(false); }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.amountSymbol}>{symbol}</Text>
            </View>
            <Text style={styles.usdLine}>{amountUsd !== null ? formatUsd(amountUsd) : ' '}</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity style={styles.pctChip} activeOpacity={0.8} onPress={() => setPct(0.25)}><Text style={styles.pctText}>25%</Text></TouchableOpacity>
              <TouchableOpacity style={styles.pctChip} activeOpacity={0.8} onPress={() => setPct(0.5)}><Text style={styles.pctText}>50%</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.pctChip, styles.maxChip]} activeOpacity={0.8} onPress={onMax}><Text style={[styles.pctText, { color: '#fff' }]}>MAX</Text></TouchableOpacity>
            </View>
          </Reveal>

          <Reveal index={2} style={styles.card}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>{isUb3Id ? 'Service fee' : 'Service fee (1%, min $0.10)'}</Text>
              <Text style={[styles.feeValue, isUb3Id && { color: '#22C55E' }]}>{serviceFeeText}</Text>
            </View>
            <View style={styles.feeDivider} />
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Network fee</Text>
              <Text style={styles.feeValue}>Shown on review</Text>
            </View>
          </Reveal>

          {errMsg ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{errMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onReview}
            style={[styles.reviewBtn, !canReview && { opacity: 0.5 }]}
          >
            <Text style={styles.reviewText}>Review</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      <ConfirmationSheet
        visible={confirmVisible}
        title={'Send ' + symbol}
        icon="paper-plane"
        rows={[
          { label: 'To', value: ub3Recipient ? (ub3Recipient.name + ' (' + ub3Recipient.id + ')') : truncateAddress(address) },
          { label: 'Amount', value: amount + ' ' + symbol },
          { label: 'Network fee', value: fee ? formatUsd(fee.networkFeeUsd) : '...' },
          { label: ub3Recipient ? 'Service fee' : 'Service fee (1%, min $0.10)', value: ub3Recipient ? 'Free' : (serviceFee ? formatUsd(serviceFee * usdRate) : '...') },
          { label: 'Total from your balance', value: usdRate ? trim(Number(amount) + (ub3Recipient ? 0 : serviceFee), 8) + ' ' + symbol : '...' },
          { label: 'Total fee', value: fee && usdRate ? formatUsd(fee.networkFeeUsd + (ub3Recipient ? 0 : serviceFee) * usdRate) : '...' },
        ]}
        onConfirm={onConfirm}
        onCancel={() => setConfirmVisible(false)}
        loading={sending}
      />
    </View>
  );
}

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 380, delay: Math.min(index, 8) * 80, useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

const SHADOW = '#2a1260';

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden', alignItems: 'center' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  assetRing: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#A78BFA', shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroAsset: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 12 },
  netPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  netDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  netText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 14, height: 54, marginTop: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  recipInput: { flex: 1, color: colors.textPrimary, fontSize: 15, height: 54 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.violet, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  pasteText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  idChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'rgba(34,197,94,0.14)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  idChipText: { color: '#22C55E', fontSize: 12, fontWeight: '800' },
  savedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  savedIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  savedTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  savedSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amountTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availText: { color: colors.textSecondary, fontSize: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 8 },
  amountInput: { flex: 1, color: colors.textPrimary, fontSize: 40, fontWeight: '800', textAlign: 'right', height: 62, padding: 0 },
  amountSymbol: { color: colors.violet, fontSize: 20, fontWeight: '800', minWidth: 54 },
  usdLine: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 2, marginBottom: 14, minHeight: 20 },
  chipRow: { flexDirection: 'row', gap: 10 },
  pctChip: { flex: 1, height: 40, borderRadius: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  maxChip: {
    backgroundColor: colors.violet, borderColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  pctText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  feeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  feeLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', flex: 1, marginRight: 10 },
  feeValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  feeDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 8 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 16,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 58, borderRadius: 20, backgroundColor: colors.violet, marginTop: 20,
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  reviewText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
