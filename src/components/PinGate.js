import React, { useState, useEffect } from 'react';
import PinPad from './PinPad';
import ForgotPinModal from './ForgotPinModal';
import * as walletService from '../services/walletService';

const MSG = {
  PIN_INVALID: 'Wrong PIN. Try again.',
  PIN_LOCKED: 'Too many wrong attempts. Try again in 15 minutes.',
  PIN_REQUIRED: 'Enter your 4-digit PIN.',
};

export default function PinGate({ visible, busy, errorCode, onSubmit, onCancel }) {
  const [mode, setMode] = useState(null);
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (!visible) { setMode(null); return undefined; }
    let alive = true;
    setError('');
    setFirst('');
    walletService.getPinStatus()
      .then((s) => { if (alive) setMode(s && s.hasPin ? 'enter' : 'create'); })
      .catch(() => { if (alive) { setError('Could not check your PIN. Try again.'); setMode('enter'); } });
    return () => { alive = false; };
  }, [visible]);

  useEffect(() => {
    if (!errorCode) return;
    if (errorCode === 'PIN_NOT_SET') { setError(''); setMode('create'); }
    else setError(MSG[errorCode] || 'Wrong PIN. Try again.');
  }, [errorCode]);

  const onComplete = async (pin) => {
    if (mode === 'enter') { setError(''); return onSubmit(pin); }
    if (mode === 'create') { setFirst(pin); setError(''); setMode('confirm'); return undefined; }
    if (mode === 'confirm') {
      if (pin !== first) { setError('PINs do not match. Start again.'); setFirst(''); setMode('create'); return undefined; }
      setSaving(true);
      try { await walletService.setPin(pin); }
      catch (e) { setSaving(false); setError('Could not save PIN. Try again.'); setMode('create'); return undefined; }
      setSaving(false);
      return onSubmit(pin);
    }
    return undefined;
  };

  if (forgot) {
    return (
      <ForgotPinModal
        visible
        onClose={() => setForgot(false)}
        onDone={() => { setForgot(false); setError(''); setMode('enter'); }}
      />
    );
  }

  return (
    <PinPad
      visible={!!visible && !!mode}
      title={mode === 'enter' ? 'Enter PIN' : mode === 'create' ? 'Create a PIN' : 'Confirm your PIN'}
      subtitle={mode === 'enter' ? 'Enter your 4-digit PIN to approve this payment' : mode === 'create' ? 'Choose a 4-digit PIN to protect your payments' : 'Enter the PIN again to confirm'}
      error={error}
      busy={!!busy || saving}
      onComplete={onComplete}
      onCancel={onCancel}
      onForgot={mode === 'enter' ? () => setForgot(true) : undefined}
    />
  );
}
