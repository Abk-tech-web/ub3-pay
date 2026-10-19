import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Animated, AppState } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiGet } from '../services/api';

const TYPES = {
  update: { label: 'Update', icon: 'zap' },
  promo: { label: 'Promo', icon: 'gift' },
  security: { label: 'Security', icon: 'shield' },
  info: { label: 'Info', icon: 'info' },
};
const keyFor = (uid) => 'ub3_ann_popup_' + uid;

export default function AnnouncementPopup() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const uid = user && user.uid;
  const [item, setItem] = useState(null);
  const lastFetch = useRef(0);
  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const check = async () => {
    if (!uid) return;
    const now = Date.now();
    if (now - lastFetch.current < 60000) return;
    lastFetch.current = now;
    try {
      let seen = 0;
      try { seen = Number(await SecureStore.getItemAsync(keyFor(uid))) || 0; } catch (e) {}
      const r = await apiGet('/announcements');
      const list = ((r && r.items) || []).filter((i) => i.active !== false && i.createdAt > seen);
      if (list.length) setItem(list[0]);
    } catch (e) {}
  };

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') check(); });
    return () => sub.remove();
  }, [uid]);

  useEffect(() => {
    if (!item) return;
    scale.setValue(0.9);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [item && item.id]);

  const dismiss = async () => {
    const it = item;
    setItem(null);
    if (it && uid) {
      try { await SecureStore.setItemAsync(keyFor(uid), String(it.createdAt)); } catch (e) {}
    }
  };

  const t = (item && TYPES[item.type]) || TYPES.update;

  return (
    <Modal visible={!!item} transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        {item ? (
          <Animated.View style={[styles.card, { backgroundColor: colors.bgCard, opacity: fade, transform: [{ scale }] }]}>
            <View style={styles.head}>
              <View style={styles.glowA} />
              <View style={styles.glowB} />
              <View style={styles.iconCircle}>
                <Feather name={t.icon} size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.tag}>{t.label.toUpperCase()}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Pressable onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={{ padding: 22 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 23 }}>{item.body}</Text>
            </ScrollView>
            <View style={{ paddingHorizontal: 22, paddingBottom: 22 }}>
              <Pressable
                onPress={dismiss}
                style={({ pressed }) => [styles.btn, { backgroundColor: colors.violet }, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.btnText}>Got it</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,45,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  card: {
    width: '100%', maxWidth: 420, borderRadius: 30, overflow: 'hidden',
    shadowColor: '#2a1260', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 24,
  },
  head: { backgroundColor: '#4C1D95', paddingTop: 30, paddingBottom: 26, paddingHorizontal: 54, alignItems: 'center', overflow: 'hidden' },
  glowA: { position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -60, left: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(139,92,246,0.35)' },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  tag: { color: '#ddd6fe', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  btn: { height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
