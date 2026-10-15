import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import PinPad from './PinPad';
import * as walletService from '../services/walletService';

const PURPLE = '#7C3AED';

export default function ForgotPinModal({ visible, onClose, onDone }) {
  const [stage, setStage] = useState('request');
  const [otp, setOtp] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [kb, setKb] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates ? e.endCoordinates.height : 0));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      setStage('request');
      setOtp('');
      setFirstPin('');
      setError('');
      setBusy(false);
    }
  }, [visible]);

  const has = (e, code) => !!(e && e.message && e.message.includes(code));

  const sendCode = async () => {
    setBusy(true);
    setError('');
    try {
      await walletService.requestPinReset();
      setStage('otp');
    } catch (e) {
      setError(has(e, 'WAIT_BEFORE_RETRY') ? 'Please wait a minute before requesting another code.' : 'Could not send the code. Please try again.');
    }
    setBusy(false);
  };

  const submitOtp = () => {
    if (otp.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setError('');
    setStage('newpin');
  };

  const onPin = async (pin) => {
    if (stage === 'newpin') { setFirstPin(pin); setError(''); setStage('confirmpin'); return; }
    if (pin !== firstPin) { setError('PINs do not match. Start again.'); setFirstPin(''); setStage('newpin'); return; }
    setBusy(true);
    try {
      await walletService.confirmPinReset(otp, pin);
      setBusy(false);
      if (onDone) onDone();
    } catch (e) {
      setBusy(false);
      if (has(e, 'OTP_INVALID')) { setError('That code is wrong. Check your email and try again.'); setOtp(''); setStage('otp'); }
      else if (has(e, 'OTP_EXPIRED') || has(e, 'TOO_MANY_TRIES') || has(e, 'NO_RESET_PENDING')) { setError('That code is no longer valid. Request a new one.'); setOtp(''); setStage('request'); }
      else { setError('Could not reset your PIN. Please try again.'); setStage('newpin'); }
    }
  };

  if (!visible) return null;

  if (stage === 'newpin' || stage === 'confirmpin') {
    return (
      <PinPad
        visible
        title={stage === 'newpin' ? 'Create new PIN' : 'Confirm new PIN'}
        subtitle={stage === 'newpin' ? 'Choose a new 4-digit PIN' : 'Enter the new PIN again'}
        error={error}
        busy={busy}
        onComplete={onPin}
        onCancel={onClose}
      />
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: 32 + kb }]}>
          <Text style={styles.title}>Reset your PIN</Text>
          {stage === 'request' ? (
            <Text style={styles.sub}>We will email a 6-digit code to your account email to confirm it is you.</Text>
          ) : (
            <Text style={styles.sub}>Enter the 6-digit code we sent to your email.</Text>
          )}
          {stage === 'otp' ? (
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={stage === 'request' ? sendCode : submitOtp} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{stage === 'request' ? 'Send code' : 'Continue'}</Text>}
          </TouchableOpacity>
          {stage === 'otp' ? (
            <TouchableOpacity onPress={sendCode} disabled={busy}>
              <Text style={styles.link}>Resend code</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={onClose} disabled={busy}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 18 },
  input: { borderWidth: 1.5, borderColor: PURPLE, borderRadius: 14, paddingVertical: 14, fontSize: 24, letterSpacing: 8, textAlign: 'center', color: '#111827', marginBottom: 12 },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  btn: { backgroundColor: PURPLE, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: PURPLE, fontWeight: '600', textAlign: 'center', marginTop: 14, fontSize: 15 },
  cancel: { color: '#6B7280', textAlign: 'center', marginTop: 14, fontSize: 15 },
});
