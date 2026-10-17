import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import ForgotPinModal from '../../components/ForgotPinModal';
import { apiGet } from '../../services/api';

export default function SendScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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
  const [fee, setFee] = useState(null);
  const [ub3Recipient, setUb3Recipient] = useState(null);

  const justAppliedAddress = useRef(false);

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
    setConfirmVisible(false);
    try {
      const s = await walletService.getPinStatus();
      setPinError('');
      setFirstPin('');
      setPinMode(s.hasPin ? 'enter' : 'create');
    } catch (e) {
      setError('Could not start the PIN check. Please try again.');
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
      const result = await walletService.sendCrypto(user.uid, chainId, symbol, ub3Recipient ? '' : address, amount, isMax, pin, ub3Recipient ? ub3Recipient.id : undefined);
      adjustCryptoBalance(symbol, -Number(amount));
      if (refreshPortfolio) refreshPortfolio();
      setConfirmVisible(false);
      setPinMode(null);
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
      setConfirmVisible(false);
      if (['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'].includes(e.message)) { handlePinError(e.message); } else { setPinMode(null); setError(e.message || "Send failed"); }
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
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
      <View style={styles.body}>
        <Text style={styles.title}>Send {symbol}</Text>

        {insufficient ? <Text style={styles.error}>{insufficientMsg}</Text> : error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Recipient address</Text>
          
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SelectRecipient', { targetRoute: 'SendAmount', chainId, symbol })}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Feather name="users" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>Saved & Recent</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Pick from your favourites or people you have sent to before</Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <FloatingInput
          label={symbol === 'SOL' ? 'SOL address or UB3 ID' : `${symbol} Address`}
          value={address}
          onChangeText={(t) => { setAddress(t); setError(''); setUb3Recipient(null); }}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Amount</Text>
        <FloatingInput
          label="Amount"
          value={amount}
          onChangeText={(t) => { setAmount(t); setError(''); setIsMax(false); }}
          keyboardType="decimal-pad"
        />
        {amountUsd !== null ? (
          <Text style={styles.usdLine}>{formatUsd(amountUsd)}</Text>
        ) : null}

        {availText !== null ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>Available: {availText} {symbol}</Text>
            <Text onPress={onMax} style={{ color: '#7c3aed', fontSize: 13, fontWeight: '700' }}>Max</Text>
          </View>
        ) : null}

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Review" onPress={onReview} />
      </View>

      <ConfirmationSheet
        visible={confirmVisible}
        title={`Send ${symbol}`}
        icon="paper-plane"
        rows={[
          { label: 'To', value: ub3Recipient ? (ub3Recipient.name + ' (' + ub3Recipient.id + ')') : truncateAddress(address) },
          { label: 'Amount', value: `${amount} ${symbol}` },
          { label: 'Network fee', value: fee ? formatUsd(fee.networkFeeUsd) : '...' },
              { label: ub3Recipient ? 'Service fee' : 'Service fee (1%, min $0.10)', value: ub3Recipient ? 'Free' : (serviceFee ? formatUsd(serviceFee * usdRate) : '...') },
            { label: 'Total from your balance', value: usdRate ? trim(Number(amount) + (ub3Recipient ? 0 : serviceFee), 8) + ' ' + symbol : '...' },
          { label: 'Total fee', value: fee && usdRate ? formatUsd(fee.networkFeeUsd + (ub3Recipient ? 0 : serviceFee) * usdRate) : '...' },
        ]}
        onConfirm={onConfirm}
        onCancel={() => setConfirmVisible(false)}
        loading={sending}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(6) },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(2),
    borderWidth: 1, borderColor: colors.border,
  },
  usdLine: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(4) },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
