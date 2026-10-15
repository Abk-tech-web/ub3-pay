import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

const PURPLE = '#7C3AED';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function PinPad({ visible, title, subtitle, error, busy, onComplete, onCancel, onForgot }) {
  const [digits, setDigits] = useState('');

  useEffect(() => {
    setDigits('');
  }, [visible, title]);

  const press = (k) => {
    if (busy) return;
    if (k === 'del') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        setDigits('');
        if (onComplete) onComplete(next);
      }, 120);
    }
  };

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i < digits.length && styles.dotFilled]} />
            ))}
          </View>
          <View style={styles.statusRow}>
            {busy ? <ActivityIndicator color={PURPLE} /> : error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
          <View style={styles.pad}>
            {KEYS.map((k, idx) =>
              k === '' ? (
                <View key={idx} style={styles.keyWrap} />
              ) : (
                <TouchableOpacity key={idx} style={styles.keyWrap} onPress={() => press(k)} activeOpacity={0.6}>
                  <Text style={styles.keyText}>{k === 'del' ? '\u232B' : k}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
          {onForgot ? (
            <TouchableOpacity onPress={onForgot}>
              <Text style={styles.link}>Forgot PIN?</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={onCancel} disabled={busy}>
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
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#C4B5FD', marginHorizontal: 8 },
  dotFilled: { backgroundColor: PURPLE, borderColor: PURPLE },
  statusRow: { minHeight: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  pad: { flexDirection: 'row', flexWrap: 'wrap' },
  keyWrap: { width: '33.33%', height: 64, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 28, fontWeight: '600', color: '#111827' },
  link: { color: PURPLE, fontWeight: '600', textAlign: 'center', marginTop: 8, fontSize: 15 },
  cancel: { color: '#6B7280', textAlign: 'center', marginTop: 14, fontSize: 15 },
});
