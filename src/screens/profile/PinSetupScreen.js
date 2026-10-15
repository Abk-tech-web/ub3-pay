import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import PinPad from '../../components/PinPad';
import ForgotPinModal from '../../components/ForgotPinModal';
import * as walletService from '../../services/walletService';

export default function PinSetupScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [hasPin, setHasPin] = useState(null);
  const [stage, setStage] = useState(null);
  const [cur, setCur] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    walletService.getPinStatus()
      .then((s) => setHasPin(!!(s && s.hasPin)))
      .catch(() => setHasPin(false));
  }, []);

  const start = () => {
    setMsg('');
    setError('');
    setCur('');
    setFirst('');
    setStage(hasPin ? 'current' : 'new');
  };

  const onComplete = async (pin) => {
    if (stage === 'current') { setCur(pin); setError(''); setStage('new'); return; }
    if (stage === 'new') { setFirst(pin); setError(''); setStage('confirm'); return; }
    if (stage === 'confirm') {
      if (pin !== first) { setError('PINs do not match. Start again.'); setFirst(''); setStage('new'); return; }
      setBusy(true);
      try {
        await walletService.setPin(pin, hasPin ? cur : undefined);
        setHasPin(true);
        setStage(null);
        setMsg(hasPin ? 'Your PIN has been changed.' : 'Your PIN has been created.');
      } catch (e) {
        const code = (e && (e.code || e.message)) || '';
        if (code === 'PIN_INVALID') { setError('Current PIN is wrong.'); setStage('current'); }
        else if (code === 'PIN_LOCKED') { setError('Too many wrong attempts. Try again in 15 minutes.'); setStage('current'); }
        else { setError('Could not save your PIN. Try again.'); setStage('new'); }
      }
      setBusy(false);
    }
  };

  const title = stage === 'current' ? 'Enter current PIN' : stage === 'new' ? (hasPin ? 'Create new PIN' : 'Create a PIN') : 'Confirm new PIN';
  const subtitle = stage === 'current' ? 'Enter your current 4-digit PIN' : stage === 'new' ? 'Choose a 4-digit PIN' : 'Enter the PIN again to confirm';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Transaction PIN</Text>
        <Text style={styles.subtitle}>Required to approve sends, withdrawals, airtime and data.</Text>
        {hasPin === null ? null : (
          <Text style={styles.status}>{hasPin ? 'A PIN is set on your account.' : 'You have not set a PIN yet.'}</Text>
        )}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}
        <View style={{ flex: 1 }} />
        <PrimaryButton title={hasPin ? 'Change PIN' : 'Create PIN'} onPress={start} disabled={hasPin === null} />
      </View>
      {forgot ? (
        <ForgotPinModal
          visible
          onClose={() => setForgot(false)}
          onDone={() => { setForgot(false); setStage(null); setMsg('Your PIN has been reset.'); setHasPin(true); }}
        />
      ) : (
        <PinPad
          visible={!!stage}
          title={title}
          subtitle={subtitle}
          error={error}
          busy={busy}
          onComplete={onComplete}
          onCancel={() => { setStage(null); setError(''); }}
          onForgot={stage === 'current' ? () => setForgot(true) : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(6) },
  status: { color: colors.textPrimary, fontSize: 15 },
  ok: { color: '#16A34A', fontSize: 14, marginTop: spacing(3) },
});
