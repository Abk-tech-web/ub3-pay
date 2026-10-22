import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet, Image, Modal, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import UB3Loader from '../UB3Loader';
import { getImage, cacheImage } from '../../services/supportService';

const SHADOW = '#2a1260';
const MAX_B64 = 900000;

function timeLabel(ms) {
  try { return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
}
function dayLabel(ms) {
  const d = new Date(ms);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
function hourLabel(h) {
  const n = ((h + 11) % 12) + 1;
  return n + (h < 12 ? 'am' : 'pm');
}
function friendly(e) {
  const c = (e && (e.code || e.message)) || '';
  if (c === 'too_many_messages') return 'You are sending messages too fast. Please wait a moment.';
  if (c === 'image_too_large') return 'That photo is too large. Choose a smaller photo or a screenshot.';
  if (c === 'bad_image_type' || c === 'bad_image') return 'That photo type is not supported.';
  return 'Could not send. Check your connection and try again.';
}

async function pickPhoto() {
  let ImagePicker = null;
  try { ImagePicker = require('expo-image-picker'); } catch (e) { ImagePicker = null; }
  if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
    Alert.alert('Photos not available', 'Please update the app to send photos.');
    return null;
  }
  let res;
  try {
    res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true });
  } catch (e) {
    Alert.alert('Photos not available', 'Please update the app to send photos.');
    return null;
  }
  if (!res || res.canceled || !res.assets || !res.assets[0]) return null;
  const a = res.assets[0];
  let b64 = a.base64 || '';
  let mime = ['image/jpeg', 'image/png', 'image/webp'].indexOf(a.mimeType) >= 0 ? a.mimeType : 'image/jpeg';
  try {
    const IM = require('expo-image-manipulator');
    const out = await IM.manipulateAsync(a.uri, [{ resize: { width: 1000 } }], { compress: 0.5, format: IM.SaveFormat.JPEG, base64: true });
    if (out && out.base64) { b64 = out.base64; mime = 'image/jpeg'; }
  } catch (e) {}
  if (!b64) return null;
  if (b64.length > MAX_B64) {
    Alert.alert('Photo too large', 'Please choose a smaller photo or a screenshot.');
    return null;
  }
  return { base64: b64, mime: mime, uri: 'data:' + mime + ';base64,' + b64 };
}

function ChatImage({ imageId, local, onOpen, styles, colors }) {
  const [img, setImg] = useState(local || null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (img || !imageId) return undefined;
    let alive = true;
    getImage(imageId).then((d) => { if (alive) setImg(d); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [imageId]);
  if (failed) {
    return (
      <View style={styles.imgBox}>
        <Feather name="image" size={22} color={colors.textSecondary} />
        <Text style={styles.imgFail}>Photo unavailable</Text>
      </View>
    );
  }
  if (!img) {
    return (
      <View style={styles.imgBox}>
        <UB3Loader size={32} color={colors.violet} />
      </View>
    );
  }
  const uri = 'data:' + (img.mime || 'image/jpeg') + ';base64,' + img.base64;
  return (
    <Pressable onPress={() => onOpen(uri)}>
      <Image source={{ uri: uri }} style={styles.imgThumb} resizeMode="cover" />
    </Pressable>
  );
}

function Bubble({ m, mine, styles, colors, onOpen }) {
  if (m.sender === 'system') {
    return (
      <View style={styles.sysWrap}>
        <View style={styles.sysPill}>
          <Feather name="clock" size={12} color={colors.violet} />
          <Text style={styles.sysText}>{m.text}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.msgRow, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {m.category ? <Text style={[styles.catTag, mine && { color: 'rgba(255,255,255,0.8)' }]}>{m.category}</Text> : null}
        {(m.imageId || m.local) ? (
          <ChatImage imageId={m.imageId} local={m.local} onOpen={onOpen} styles={styles} colors={colors} />
        ) : null}
        {m.text ? <Text style={[styles.msgText, mine && { color: '#fff' }]}>{m.text}</Text> : null}
        <Text style={[styles.msgTime, mine && { color: 'rgba(255,255,255,0.72)' }]}>
          {m.tmp ? 'Sending...' : timeLabel(m.createdAt)}{(!mine && m.sender === 'admin') ? '  \u00B7  UB3 Support' : ''}
        </Text>
      </View>
    </View>
  );
}

export default function ChatView({ mode, load, send, categories, showBanner, emptyTitle, emptySub, onMeta }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [meta, setMeta] = useState(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [viewer, setViewer] = useState(null);
  const lastTs = useRef(0);
  const listRef = useRef(null);
  const myRole = mode === 'admin' ? 'admin' : 'user';
  const rootRef = useRef(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const EXTRA = 12;
    const fit = (kbHeight) => {
      if (!rootRef.current) return;
      rootRef.current.measureInWindow((x, y, w, h) => {
        const winH = Dimensions.get('window').height;
        const overlap = y + h - (winH - kbHeight);
        setLift(overlap > 0 ? Math.round(overlap) + EXTRA : 0);
      });
    };
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      const kb = e && e.endCoordinates ? e.endCoordinates.height : 0;
      if (!kb) return;
      setTimeout(() => fit(kb), 150);
      setTimeout(() => fit(kb), 450);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setLift(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => { if (listRef.current) listRef.current.scrollToEnd({ animated: true }); }, 60);
    });
    return () => sub.remove();
  }, []);

  const merge = useCallback((incoming) => {
    if (!incoming || !incoming.length) return;
    incoming.forEach((x) => { if (x.createdAt > lastTs.current) lastTs.current = x.createdAt; });
    setMessages((prev) => {
      const base = prev.filter((p) => !p.tmp);
      const tmps = prev.filter((p) => p.tmp);
      const ids = new Set(base.map((p) => p.id));
      const fresh = incoming.filter((x) => !ids.has(x.id));
      if (!fresh.length) return prev;
      return base.concat(fresh).sort((a, b) => a.createdAt - b.createdAt).concat(tmps);
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const r = await load(lastTs.current);
      if (r) {
        merge(r.messages || []);
        setMeta(r);
        if (onMeta) onMeta(r);
      }
    } catch (e) {}
    setLoaded(true);
  }, [load, merge]);

  useFocusEffect(useCallback(() => {
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [poll]));

  const rows = useMemo(() => {
    const out = [];
    let lastDay = '';
    messages.forEach((m) => {
      const d = dayLabel(m.createdAt);
      if (d !== lastDay) { out.push({ key: 'day_' + d + '_' + m.id, type: 'day', label: d }); lastDay = d; }
      out.push({ key: m.id, type: 'msg', m: m });
    });
    return out;
  }, [messages]);

  const attach = async () => {
    const p = await pickPhoto();
    if (p) { setPending(p); setError(''); }
  };

  const doSend = async () => {
    const t = text.trim();
    if ((!t && !pending) || sending) return;
    setError('');
    setSending(true);
    const sentText = text;
    const sentPending = pending;
    const tmp = {
      id: 'tmp_' + Date.now(), tmp: true, sender: myRole, text: t, createdAt: Date.now(), category: category || null,
      local: sentPending ? { base64: sentPending.base64, mime: sentPending.mime } : null,
    };
    setMessages((p) => p.concat([tmp]));
    const body = { text: t };
    if (category) body.category = category;
    if (sentPending) { body.imageBase64 = sentPending.base64; body.mime = sentPending.mime; }
    setText('');
    setPending(null);
    try {
      const r = await send(body);
      setMessages((p) => p.filter((x) => x.id !== tmp.id));
      const add = [];
      if (r && r.message) {
        add.push(r.message);
        if (r.message.imageId && sentPending) cacheImage(r.message.imageId, { base64: sentPending.base64, mime: sentPending.mime });
      }
      if (r && r.auto) add.push(r.auto);
      merge(add);
    } catch (e) {
      setMessages((p) => p.filter((x) => x.id !== tmp.id));
      setText(sentText);
      setPending(sentPending);
      setError(friendly(e));
    }
    setSending(false);
  };

  const canSend = !sending && (text.trim().length > 0 || !!pending);

  const renderEmpty = () => {
    if (!loaded) {
      return (
        <View style={{ alignItems: 'center', marginTop: 70 }}>
          <UB3Loader size={72} color={colors.violet} />
        </View>
      );
    }
    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyCircle}>
          <Feather name="message-circle" size={28} color={colors.violet} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle || 'How can we help?'}</Text>
        <Text style={styles.emptySub}>{emptySub || 'Describe your issue below. You can attach a screenshot or photo as proof.'}</Text>
      </View>
    );
  };

  return (
    <View ref={rootRef} collapsable={false} style={{ flex: 1, paddingBottom: lift }}>
      {showBanner && meta ? (
        <View style={[styles.banner, meta.open ? styles.bannerOpen : styles.bannerClosed]}>
          <View style={[styles.dot, { backgroundColor: meta.open ? '#22C55E' : '#f59e0b' }]} />
          <Text style={styles.bannerText}>
            {meta.open
              ? 'Customer service is available ' + hourLabel((meta.hours && meta.hours.start) || 9) + ' to ' + hourLabel((meta.hours && meta.hours.end) || 23) + '.'
              : 'We are offline now. Customer service is available ' + hourLabel((meta.hours && meta.hours.start) || 9) + ' to ' + hourLabel((meta.hours && meta.hours.end) || 23) + '. Leave a message and we will reply when we are back.'}
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(r) => r.key}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, flexGrow: 1 }}
        onContentSizeChange={() => { if (listRef.current && rows.length) listRef.current.scrollToEnd({ animated: true }); }}
        ListEmptyComponent={renderEmpty()}
        renderItem={({ item }) => {
          if (item.type === 'day') {
            return (
              <View style={styles.dayWrap}>
                <Text style={styles.dayText}>{item.label}</Text>
              </View>
            );
          }
          return <Bubble m={item.m} mine={item.m.sender === myRole} styles={styles} colors={colors} onOpen={setViewer} />;
        }}
      />

      {categories && categories.length ? (
        <View style={styles.catWrap}>
          <Text style={styles.catTitle}>What is the issue about?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {categories.map((c) => {
              const on = category === c;
              return (
                <Pressable key={c} onPress={() => setCategory(on ? '' : c)} style={[styles.catChip, on && styles.catChipOn]}>
                  <Text style={[styles.catChipText, on && { color: '#fff' }]}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.composer}>
        {pending ? (
          <View style={styles.pendingRow}>
            <Image source={{ uri: pending.uri }} style={styles.pendingImg} />
            <Text style={styles.pendingText}>Photo attached</Text>
            <Pressable onPress={() => setPending(null)} hitSlop={10}>
              <Feather name="x-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <View style={styles.inputRow}>
          <Pressable onPress={attach} style={styles.attachBtn} hitSlop={6}>
            <Feather name="image" size={20} color={colors.violet} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
          />
          <Pressable onPress={doSend} disabled={!canSend} style={[styles.sendBtn, !canSend && { opacity: 0.45 }]}>
            {sending ? <UB3Loader size={22} color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </View>

      <Modal visible={!!viewer} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerBackdrop}>
          {viewer ? <Image source={{ uri: viewer }} style={styles.viewerImg} resizeMode="contain" /> : null}
          <Pressable onPress={() => setViewer(null)} style={styles.viewerClose} hitSlop={10}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  bannerOpen: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  bannerClosed: { backgroundColor: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.3)' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  bannerText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 17 },
  dayWrap: { alignItems: 'center', marginVertical: 10 },
  dayText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, backgroundColor: colors.bgCard, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  sysWrap: { alignItems: 'center', marginVertical: 8 },
  sysPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, maxWidth: '88%' },
  sysText: { color: colors.violet, fontSize: 12, fontWeight: '700', flexShrink: 1, lineHeight: 17 },
  msgRow: { flexDirection: 'row', marginVertical: 4 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.violet, borderBottomRightRadius: 6 },
  bubbleTheirs: {
    backgroundColor: colors.bgCard, borderBottomLeftRadius: 6,
    shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  catTag: { color: colors.violet, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 4, textTransform: 'uppercase' },
  msgText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  msgTime: { color: colors.textSecondary, fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  imgBox: { width: 200, height: 150, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 6, gap: 6 },
  imgFail: { color: colors.textSecondary, fontSize: 12 },
  imgThumb: { width: 200, height: 200, borderRadius: 14, marginBottom: 6 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 28 },
  emptyCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  catWrap: { paddingHorizontal: 16, paddingTop: 8 },
  catTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  catChip: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  catChipOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  catChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  composer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.bg },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: 14, padding: 8, marginBottom: 8 },
  pendingImg: { width: 44, height: 44, borderRadius: 10 },
  pendingText: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  err: { color: colors.danger, fontSize: 12, marginBottom: 6, marginLeft: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.bgCard, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerImg: { width: '100%', height: '85%' },
  viewerClose: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
});
