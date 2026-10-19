import React, { useState, useCallback, useLayoutEffect, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost } from '../../services/api';
import UB3Loader from '../../components/UB3Loader';
import ProcessingOverlay from '../../components/ProcessingOverlay';

const SHADOW = '#2a1260';
const TYPES = {
  update: { label: 'Update', icon: 'zap', color: '#7C3AED' },
  promo: { label: 'Promo', icon: 'gift', color: '#f59e0b' },
  security: { label: 'Security', icon: 'shield', color: '#ef4444' },
  info: { label: 'Info', icon: 'info', color: '#3b82f6' },
};

function ago(ms) {
  if (!ms) return '';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' day' + (Math.floor(s / 86400) === 1 ? '' : 's') + ' ago';
  try { return new Date(ms).toDateString(); } catch (e) { return ''; }
}

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 360, delay: Math.min(index, 8) * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = user && user.uid;

  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [seenAt, setSeenAt] = useState(0);
  const [form, setForm] = useState(null);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState(null);
  const [doneTitle, setDoneTitle] = useState('Published');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    try {
      const r = await apiGet('/announcements');
      setItems((r && r.items) || []);
      setIsAdmin(!!(r && r.isAdmin));
      setLoadErr('');
    } catch (e) {
      setLoadErr('Could not load notifications. Pull down to try again.');
    }
    setLoading(false);
  }, []);

  const seenKey = 'ub3_ann_seen_' + uid;
  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      let prev = 0;
      try { prev = Number(await SecureStore.getItemAsync(seenKey)) || 0; } catch (e) {}
      if (alive) setSeenAt(prev);
      await load();
      try { await SecureStore.setItemAsync(seenKey, String(Date.now())); } catch (e) {}
    })();
    return () => { alive = false; };
  }, [load, seenKey]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const flash = (title) => {
    setDoneTitle(title);
    setTimeout(() => {
      setPhase('success');
      setTimeout(() => setPhase(null), 1300);
    }, 350);
  };

  const openNew = () => { setFormErr(''); setForm({ id: null, type: 'update', title: '', body: '', active: true }); };
  const openEdit = (it) => {
    setFormErr('');
    setForm({ id: it.id, type: it.type || 'update', title: it.title, body: it.body, active: it.active !== false });
  };

  const save = async () => {
    if (!form || saving) return;
    const t = form.title.trim();
    const b = form.body.trim();
    if (!t || !b) { setFormErr('Add a title and a message.'); return; }
    setSaving(true);
    setFormErr('');
    try {
      if (form.id) {
        await apiPost('/announcements/' + form.id + '/update', { title: t, body: b, type: form.type, active: form.active });
      } else {
        await apiPost('/announcements', { title: t, body: b, type: form.type });
      }
      const wasEdit = !!form.id;
      setForm(null);
      await load();
      flash(wasEdit ? 'Update saved' : 'Update published');
    } catch (e) {
      setFormErr('Could not save. ' + ((e && e.message) || 'Try again.'));
    }
    setSaving(false);
  };

  const remove = () => {
    if (!form || !form.id) return;
    Alert.alert('Delete this update?', 'It will disappear for all users. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await apiPost('/announcements/' + form.id + '/delete', {});
            setForm(null);
            await load();
            flash('Update deleted');
          } catch (e) {
            setFormErr('Could not delete. Try again.');
          }
          setSaving(false);
        },
      },
    ]);
  };

  const visible = items;
  const newCount = visible.filter((i) => i.active !== false && i.createdAt > seenAt).length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Notifications</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.iconCircle}>
            <Feather name="bell" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroSub}>
            {newCount > 0 ? newCount + ' new update' + (newCount === 1 ? '' : 's') + ' from UB3 Pay' : 'The latest news from UB3 Pay'}
          </Text>
          {isAdmin ? (
            <Pressable style={({ pressed }) => [styles.publishBtn, pressed && { opacity: 0.85 }]} onPress={openNew}>
              <Feather name="plus" size={16} color="#4C1D95" />
              <Text style={styles.publishText}>Publish update</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          {loading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <UB3Loader size={96} color={colors.violet} />
            </View>
          ) : null}

          {!loading && loadErr && visible.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="wifi-off" size={30} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>{loadErr}</Text>
            </View>
          ) : null}

          {!loading && !loadErr && visible.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyCircle}>
                <Feather name="bell-off" size={28} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>We will let you know when something needs your attention.</Text>
            </View>
          ) : null}

          {visible.map((it, i) => {
            const t = TYPES[it.type] || TYPES.update;
            const isNew = it.active !== false && it.createdAt > seenAt;
            return (
              <Reveal key={it.id} index={i} style={[styles.card, i === 0 && { marginTop: -34 }, it.active === false && { opacity: 0.6 }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.iconTile, { backgroundColor: t.color + '22' }]}>
                    <Feather name={t.icon} size={18} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{it.title}</Text>
                    <Text style={styles.cardTime}>{t.label} · {ago(it.createdAt)}</Text>
                  </View>
                  {isNew ? (
                    <View style={styles.newPill}><Text style={styles.newText}>NEW</Text></View>
                  ) : null}
                  {isAdmin ? (
                    <Pressable onPress={() => openEdit(it)} hitSlop={10} style={styles.editBtn}>
                      <Feather name="edit-2" size={15} color={colors.violet} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.cardBody}>{it.body}</Text>
                {isAdmin && it.active === false ? <Text style={styles.hidden}>Hidden from users</Text> : null}
              </Reveal>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!form} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setForm(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setForm(null)} />
          {form ? (
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.sheetTitle}>{form.id ? 'Edit update' : 'Publish an update'}</Text>
                <Text style={styles.sheetSub}>Everyone using UB3 Pay will see this in Notifications.</Text>

                <View style={styles.chipRow}>
                  {Object.keys(TYPES).map((k) => {
                    const on = form.type === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setForm({ ...form, type: k })}
                        style={[styles.typeChip, on && { backgroundColor: TYPES[k].color, borderColor: TYPES[k].color }]}
                      >
                        <Feather name={TYPES[k].icon} size={13} color={on ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.typeText, on && { color: '#fff' }]}>{TYPES[k].label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(v) => setForm({ ...form, title: v })}
                  placeholder="What is new?"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={80}
                />
                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, { height: 130, paddingTop: 14, textAlignVertical: 'top' }]}
                  value={form.body}
                  onChangeText={(v) => setForm({ ...form, body: v })}
                  placeholder="Write the details here"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={1000}
                />
                <Text style={styles.counter}>{form.body.length}/1000</Text>

                {formErr ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{formErr}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.bigBtn, pressed && { opacity: 0.85 }]}
                  onPress={save}
                  disabled={saving}
                >
                  {saving ? <UB3Loader size={30} color="#fff" /> : <Text style={styles.bigBtnText}>{form.id ? 'Save changes' : 'Publish'}</Text>}
                </Pressable>

                {form.id ? (
                  <View style={styles.editRow}>
                    <Pressable onPress={() => setForm({ ...form, active: !form.active })} hitSlop={8} style={styles.editAction}>
                      <Feather name={form.active ? 'eye-off' : 'eye'} size={16} color={colors.violet} />
                      <Text style={styles.editActionText}>{form.active ? 'Hide from users' : 'Show to users'}</Text>
                    </Pressable>
                    <Pressable onPress={remove} hitSlop={8} style={styles.editAction}>
                      <Feather name="trash-2" size={16} color={colors.danger} />
                      <Text style={[styles.editActionText, { color: colors.danger }]}>Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
                {form.id ? <Text style={styles.sheetHint}>Hide or show takes effect when you tap Save changes.</Text> : null}
                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>

      <ProcessingOverlay
        visible={phase !== null}
        phase={phase}
        title={doneTitle}
        subtitle="Users will see the change right away"
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, textAlign: 'center', paddingHorizontal: 34 },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 22, height: 44, paddingHorizontal: 22, marginTop: 16,
  },
  publishText: { color: '#4C1D95', fontWeight: '800', fontSize: 14 },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  cardTime: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  newPill: { backgroundColor: colors.violet, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  newText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  editBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 12 },
  hidden: { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginTop: 10 },
  emptyBox: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,45,0.62)' },
  sheet: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%',
    shadowColor: SHADOW, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -8 }, elevation: 20,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 14 },
  sheetTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  sheetSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  typeText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: colors.bg, color: colors.textPrimary, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  counter: { color: colors.textSecondary, fontSize: 11, textAlign: 'right', marginTop: -8, marginBottom: 12 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  editRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 4 },
  editAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editActionText: { color: colors.violet, fontSize: 14, fontWeight: '700' },
  sheetHint: { color: colors.textSecondary, fontSize: 11, marginTop: 10, textAlign: 'center' },
});
