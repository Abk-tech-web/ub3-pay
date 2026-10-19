import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import ActivityIndicator from '../../components/UB3Loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';
import { apiGet, apiPost } from '../../services/api';

const MSG = {
  invalid_id: 'Use 3-20 letters, numbers or underscores. It cannot be only numbers.',
  reserved_id: 'That ID is reserved. Try another one.',
  id_taken: 'That ID is already taken.',
  same_id: 'That is already your ID.',
  too_soon: 'You can only change your ID once every 30 days.',
};
const KNOWN = Object.keys(MSG);
const RE = /^[a-z0-9_]{3,20}$/;

function errData(e) {
  return (e && (e.data || (e.response && e.response.data))) || {};
}
function errCode(e) {
  const d = errData(e);
  if (d.error) return d.error;
  if (e && e.error) return e.error;
  if (e && e.code && KNOWN.indexOf(e.code) >= 0) return e.code;
  const m = String((e && e.message) || '');
  for (let i = 0; i < KNOWN.length; i++) {
    if (m.indexOf(KNOWN[i]) >= 0) return KNOWN[i];
  }
  return '';
}
function fmt(iso) {
  try { return new Date(iso).toDateString(); } catch (e) { return ''; }
}
function localError(h) {
  if (!h) return '';
  if (!RE.test(h) || /^[0-9]+$/.test(h)) return MSG.invalid_id;
  if (h.indexOf('ub3') === 0) return MSG.reserved_id;
  return '';
}

export default function Ub3IdScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [me, setMe] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    try {
      const r = await apiGet('/ub3id/me');
      setMe(r);
      setLoadErr('');
    } catch (e) {
      setLoadErr('Could not load your UB3 ID. Go back and try again.');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const locked = !!(me && me.nextChangeAt && new Date(me.nextChangeAt).getTime() > Date.now());
  const localErr = localError(input);
  const canSave = !busy && !locked && input.length >= 3 && !localErr;

  const copy = async (text, key) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiPost('/ub3id/set', { id: input });
      setMe(res);
      setInput('');
      setMsg({ ok: true, text: 'Your UB3 ID is now ' + res.ub3Id });
    } catch (e) {
      const code = errCode(e);
      let text = MSG[code] || 'Could not update your ID. Try again.';
      if (code === 'too_soon') {
        const next = errData(e).nextChangeAt;
        if (next) text += ' Next change: ' + fmt(next) + '.';
      }
      setMsg({ ok: false, text: text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Feather name="chevron-left" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>UB3 ID</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loadErr ? <Text style={styles.err}>{loadErr}</Text> : null}
        {!me && !loadErr ? <ActivityIndicator style={{ marginTop: 40 }} /> : null}
        {me ? (
          <View>
            <View style={styles.card}>
              <Text style={styles.label}>Your UB3 ID</Text>
              <Pressable style={styles.idRow} onPress={() => copy(me.ub3Id, 'cur')}>
                <Text style={styles.idBig}>{me.ub3Id}</Text>
                <Feather name={copied === 'cur' ? 'check' : 'copy'} size={18} color={colors.textSecondary} />
              </Pressable>
              <Text style={styles.hint}>Other UB3 Pay users can use this ID to find you.</Text>
              {me.isCustom ? (
                <Pressable style={styles.numRow} onPress={() => copy(me.ub3IdNumeric, 'num')}>
                  <Text style={styles.hint}>Number ID (always works): {me.ub3IdNumeric}</Text>
                  <Feather name={copied === 'num' ? 'check' : 'copy'} size={13} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Choose a custom ID</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.at}>@</Text>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={(t) => { setMsg(null); setInput(t.toLowerCase().replace(/[^a-z0-9_]/g, '')); }}
                  placeholder="a_nuram"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!locked && !busy}
                />
              </View>
              <Text style={styles.hint}>3-20 characters: a-z, 0-9 and _. Not only numbers.</Text>
              {localErr ? <Text style={styles.err}>{localErr}</Text> : null}
              {locked ? (
                <Text style={styles.err}>You can change your ID again on {fmt(me.nextChangeAt)}.</Text>
              ) : (
                <Text style={styles.hint}>You can change it once every 30 days. Your number ID always keeps working.</Text>
              )}
              {msg ? <Text style={msg.ok ? styles.ok : styles.err}>{msg.text}</Text> : null}
              <Pressable style={[styles.btn, !canSave && styles.btnOff]} onPress={save} disabled={!canSave}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save ID</Text>}
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(4), paddingVertical: spacing(3) },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  body: { padding: spacing(4), paddingBottom: spacing(10) },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: spacing(4), marginBottom: spacing(4) },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: spacing(2) },
  idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  idBig: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: 1, flexShrink: 1 },
  numRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(2) },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(2) },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing(3) },
  at: { color: colors.textSecondary, fontSize: 16, marginRight: 4 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16, paddingVertical: spacing(3) },
  err: { color: '#f87171', fontSize: 12, marginTop: spacing(2) },
  ok: { color: '#34d399', fontSize: 13, marginTop: spacing(2), fontWeight: '600' },
  btn: { backgroundColor: colors.violet, borderRadius: 12, paddingVertical: spacing(3.5), alignItems: 'center', marginTop: spacing(4) },
  btnOff: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
