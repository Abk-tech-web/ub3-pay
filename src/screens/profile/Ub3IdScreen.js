import React, { useState, useCallback, useLayoutEffect, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Share, Animated, Easing,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import UB3Loader from '../../components/UB3Loader';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { apiGet, apiPost } from '../../services/api';

const SHADOW = '#2a1260';
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
function pretty(id) {
  if (!id) return '...';
  if (/^[0-9]{8}$/.test(id)) return id.slice(0, 4) + ' ' + id.slice(4);
  return '@' + id;
}

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380, delay: Math.min(index, 9) * 70, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function Ub3IdScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState('');
  const [phase, setPhase] = useState(null);

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

  const share = async () => {
    if (!me || !me.ub3Id) return;
    try {
      await Share.share({ message: 'Send me money on UB3 Pay. My UB3 ID is ' + me.ub3Id });
    } catch (e) {}
  };

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setMsg(null);
    setPhase('processing');
    try {
      const res = await apiPost('/ub3id/set', { id: input });
      setMe(res);
      setInput('');
      setMsg({ ok: true, text: 'Your UB3 ID is now ' + res.ub3Id });
      setPhase('success');
      setTimeout(() => setPhase(null), 1400);
    } catch (e) {
      setPhase(null);
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

  const BackBtn = ({ solid }) => (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={10}
      style={[styles.backBtn, solid && { backgroundColor: '#4C1D95' }]}
    >
      <Feather name="chevron-left" size={22} color="#FFFFFF" />
    </Pressable>
  );

  if (!me) {
    return (
      <View style={styles.root}>
        <View style={{ position: 'absolute', left: 16, top: insets.top + 10, zIndex: 5 }}>
          <BackBtn solid />
        </View>
        <View style={styles.center}>
          {!loadErr ? (
            <UB3Loader size={96} color={colors.violet} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.errCenter}>{loadErr}</Text>
              <Pressable onPress={load} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  const rules = [
    { ok: input.length >= 3 && input.length <= 20, text: '3-20 characters' },
    { ok: input.length > 0 && !/^[0-9]+$/.test(input), text: 'Not only numbers' },
    { ok: input.length > 0 && input.indexOf('ub3') !== 0, text: 'Does not start with ub3' },
  ];

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
            <View style={styles.glowA} />
            <View style={styles.glowB} />
            <View style={styles.heroTop}>
              <BackBtn />
              <Text style={styles.heroTitle}>UB3 ID</Text>
              <View style={{ width: 38 }} />
            </View>
            <View style={styles.iconCircle}>
              <Feather name="at-sign" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.heroLabel}>YOUR UB3 ID</Text>
            <View style={styles.idPill}>
              <Text style={styles.idBig} numberOfLines={1} adjustsFontSizeToFit>{pretty(me.ub3Id)}</Text>
            </View>
            <Text style={styles.heroSub}>Other UB3 Pay users can use this ID to find you and send you money.</Text>
            <View style={styles.heroBtns}>
              <Pressable style={styles.heroBtn} onPress={() => copy(me.ub3Id, 'cur')}>
                <Feather name={copied === 'cur' ? 'check' : 'copy'} size={16} color="#fff" />
                <Text style={styles.heroBtnText}>{copied === 'cur' ? 'Copied' : 'Copy'}</Text>
              </Pressable>
              <Pressable style={[styles.heroBtn, styles.heroBtnSolid]} onPress={share}>
                <Feather name="share-2" size={16} color="#4C1D95" />
                <Text style={[styles.heroBtnText, { color: '#4C1D95' }]}>Share</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.body}>
            {me.isCustom ? (
              <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
                <View style={styles.numRow}>
                  <View style={styles.numIcon}>
                    <Feather name="hash" size={18} color={colors.violet} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.numLabel}>Number ID (always works)</Text>
                    <Text style={styles.numValue}>{pretty(me.ub3IdNumeric)}</Text>
                  </View>
                  <Pressable onPress={() => copy(me.ub3IdNumeric, 'num')} hitSlop={10} style={styles.smallCopy}>
                    <Feather name={copied === 'num' ? 'check' : 'copy'} size={16} color={colors.violet} />
                  </Pressable>
                </View>
              </Reveal>
            ) : null}

            <Reveal index={1} style={[styles.card, !me.isCustom && { marginTop: -34 }]}>
              <Text style={styles.cardTitle}>Choose a custom ID</Text>
              <Text style={styles.cardSub}>Pick something people can remember, like a_nuram.</Text>

              {locked ? (
                <View style={styles.lockBox}>
                  <Feather name="clock" size={16} color="#fbbf24" />
                  <Text style={styles.lockText}>You can change your ID again on {fmt(me.nextChangeAt)}.</Text>
                </View>
              ) : null}

              <View style={[styles.inputWrap, locked && { opacity: 0.5 }]}>
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
                <Text style={styles.count}>{input.length}/20</Text>
              </View>

              {input.length > 0 ? (
                <View style={styles.rules}>
                  {rules.map((r) => (
                    <View key={r.text} style={styles.ruleRow}>
                      <Feather name={r.ok ? 'check-circle' : 'circle'} size={14} color={r.ok ? '#22C55E' : colors.textSecondary} />
                      <Text style={[styles.ruleText, r.ok && { color: '#22C55E' }]}>{r.text}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.hint}>3-20 characters: a-z, 0-9 and _. Not only numbers.</Text>
              )}

              {!locked ? (
                <Text style={styles.hint}>You can change it once every 30 days. Your number ID always keeps working.</Text>
              ) : null}

              {msg ? (
                <View style={[styles.msgBox, msg.ok ? styles.msgOk : styles.msgErr]}>
                  <Feather name={msg.ok ? 'check-circle' : 'alert-circle'} size={16} color={msg.ok ? '#22C55E' : colors.danger} />
                  <Text style={[styles.msgText, { color: msg.ok ? '#22C55E' : colors.danger }]}>{msg.text}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.bigBtn, !canSave && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}
                onPress={save}
                disabled={!canSave}
              >
                <Text style={styles.bigBtnText}>Save ID</Text>
              </Pressable>
            </Reveal>

            <Reveal index={2} style={styles.card}>
              <Text style={styles.cardTitle}>How people pay you</Text>
              {[
                'Share your UB3 ID with a friend.',
                'They open UB3 Pay, tap Send and type your ID.',
                'They see your name to confirm, then the money arrives in your wallet.',
              ].map((t, i, arr) => (
                <View key={i} style={[styles.stepRow, i === arr.length - 1 && { marginBottom: 0 }]}>
                  <View style={styles.stepDot}><Text style={styles.stepNum}>{i + 1}</Text></View>
                  <Text style={styles.stepText}>{t}</Text>
                </View>
              ))}
            </Reveal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ProcessingOverlay
        visible={phase !== null}
        phase={phase}
        title={phase === 'success' ? 'UB3 ID updated' : 'Saving your ID'}
        subtitle={phase === 'success' ? 'People can now find you with it' : 'Just a moment'}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errCenter: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 14, paddingHorizontal: 22, height: 42, borderRadius: 21, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontWeight: '700' },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
    overflow: 'hidden', alignItems: 'center',
  },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroLabel: { color: '#ddd6fe', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  idPill: {
    marginTop: 10, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', maxWidth: '88%',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  idBig: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 3 },
  heroSub: { color: '#ede9fe', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19, paddingHorizontal: 32 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroBtnSolid: { backgroundColor: '#fff', borderColor: '#fff' },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  numLabel: { color: colors.textSecondary, fontSize: 12 },
  numValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  smallCopy: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  cardSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 14 },
  lockBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.14)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  lockText: { color: colors.textPrimary, fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16, height: 54,
    borderWidth: 1, borderColor: colors.border,
  },
  at: { color: colors.violet, fontSize: 18, fontWeight: '800', marginRight: 6 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16, height: 54 },
  count: { color: colors.textSecondary, fontSize: 12 },
  rules: { marginTop: 12, gap: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 18 },
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)' },
  msgText: { fontSize: 13, fontWeight: '600', flex: 1 },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginTop: 18,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  stepRow: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 0, alignItems: 'flex-start' },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 12 },
  stepText: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 20 },
});
