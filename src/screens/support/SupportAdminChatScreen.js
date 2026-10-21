import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import ChatView from '../../components/support/ChatView';
import { getAdminChat, sendAdminReply, setChatStatus } from '../../services/supportService';

export default function SupportAdminChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const p = (route && route.params) || {};
  const uid = p.uid;
  const [status, setStatus] = useState('open');
  const [email, setEmail] = useState(p.email || '');
  const [name, setName] = useState(p.name || '');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback((after) => getAdminChat(uid, after), [uid]);
  const send = useCallback((body) => sendAdminReply(uid, body), [uid]);
  const onMeta = useCallback((r) => {
    if (r.status) setStatus(r.status);
    if (r.email) setEmail(r.email);
    if (r.name) setName(r.name);
  }, []);

  const toggle = async () => {
    if (busy) return;
    const next = status === 'resolved' ? 'open' : 'resolved';
    setBusy(true);
    try {
      await setChatStatus(uid, next);
      setStatus(next);
    } catch (e) {}
    setBusy(false);
  };

  const resolved = status === 'resolved';

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={styles.heroTitle} numberOfLines={1}>{name || email || 'User'}</Text>
            {name && email ? <Text style={styles.heroSub} numberOfLines={1}>{email}</Text> : null}
          </View>
          <Pressable onPress={toggle} hitSlop={8} style={[styles.statusBtn, resolved && { backgroundColor: 'rgba(34,197,94,0.28)' }]}>
            <Feather name={resolved ? 'rotate-ccw' : 'check-circle'} size={14} color="#fff" />
            <Text style={styles.statusText}>{resolved ? 'Reopen' : 'Resolve'}</Text>
          </Pressable>
        </View>
      </View>
      <ChatView
        mode="admin"
        load={load}
        send={send}
        onMeta={onMeta}
        emptyTitle="No messages yet"
        emptySub="Messages from this user will show up here."
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -70, left: -50, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 12, height: 36 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
