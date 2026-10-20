import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getAvatarColor } from '../utils/avatarColor';
import UB3Loader from './UB3Loader';

const SHADOW = '#2a1260';

function parseTo(v) {
  const s = String(v || '');
  const m = s.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (m && m[1]) {
    let sub = m[2];
    if (!/^UB3/i.test(sub)) {
      sub = 'UB3 ID ' + (/^[0-9]{8}$/.test(sub) ? sub.slice(0, 4) + ' ' + sub.slice(4) : '@' + sub);
    }
    return { name: m[1], sub: sub, isAddr: false };
  }
  if (/^[A-Za-z0-9]{3,}\.\.\.[A-Za-z0-9]{3,}$/.test(s)) return { name: s, sub: 'Wallet address', isAddr: true };
  return { name: s, sub: '', isAddr: false };
}

export default function ConfirmationSheet({
  visible,
  title,
  icon = 'arrow-up-outline',
  rows = [],
  onConfirm,
  onCancel,
  loading,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);
  const slide = useRef(new Animated.Value(80)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;
    slide.setValue(80);
    fade.setValue(0);
    pop.setValue(0.6);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const hero = rows.find((r) => r.label === 'Amount');
  const toRow = rows.find((r) => r.label === 'To');
  const rest = rows.filter((r) => r !== hero && r !== toRow);
  const to = toRow ? parseTo(toRow.value) : null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={loading ? undefined : onCancel}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
          <View style={styles.handle} />
          <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
            <LinearGradient colors={['#2a0e66', '#5B21B6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.glowA} />
              <View style={styles.glowB} />
              <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
                <Ionicons name={icon} size={26} color="#fff" />
              </Animated.View>
              <Text style={styles.heroLabel}>{String(title || '').toUpperCase()}</Text>
              {hero ? (
                <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{hero.value}</Text>
              ) : null}
            </LinearGradient>

            {to ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>SENDING TO</Text>
                <View style={styles.toRow}>
                  <View style={[styles.avatar, { backgroundColor: to.isAddr ? colors.violet : getAvatarColor(to.name) }]}>
                    {to.isAddr ? (
                      <Ionicons name="wallet-outline" size={20} color="#fff" />
                    ) : (
                      <Text style={styles.avatarText}>{String(to.name).slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toName} numberOfLines={1}>{to.name}</Text>
                    {to.sub ? <Text style={styles.toSub} numberOfLines={1}>{to.sub}</Text> : null}
                  </View>
                </View>
              </View>
            ) : null}

            {rest.length > 0 ? (
              <View style={styles.card}>
                {rest.map((r, i) => {
                  const isTotal = String(r.label).indexOf('Total') === 0;
                  const isFree = r.value === 'Free';
                  const last = i === rest.length - 1;
                  return (
                    <View key={r.label} style={[styles.row, isTotal && styles.rowTotal, !isTotal && !last && styles.rowBorder]}>
                      <Text style={[styles.rowLabel, isTotal && styles.rowLabelStrong]} numberOfLines={2}>{r.label}</Text>
                      {isFree ? (
                        <View style={styles.freePill}>
                          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                          <Text style={styles.freeText}>Free</Text>
                        </View>
                      ) : (
                        <Text style={[styles.rowValue, isTotal && { color: colors.violet }]} numberOfLines={1}>{r.value}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.note}>
              <Ionicons name="shield-checkmark" size={16} color={colors.violet} />
              <Text style={styles.noteText}>Check the details carefully. Transfers cannot be reversed. You will enter your PIN next.</Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <Pressable
              onPress={onConfirm}
              disabled={!!loading}
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.88 }]}
            >
              {loading ? <UB3Loader size={30} color="#fff" /> : <Text style={styles.confirmText}>Confirm</Text>}
            </Pressable>
            <Pressable
              onPress={onCancel}
              disabled={!!loading}
              style={({ pressed }) => [styles.cancelBtn, loading && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,4,30,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%',
    shadowColor: SHADOW, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -8 }, elevation: 20,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  hero: {
    borderRadius: 26, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden', marginBottom: 14,
    shadowColor: SHADOW, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  glowA: { position: 'absolute', top: -50, right: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -60, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(167,139,250,0.30)' },
  badge: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)',
    shadowColor: '#A78BFA', shadowOpacity: 0.7, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  heroAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 8, maxWidth: '100%' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, padding: 16, marginBottom: 14,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  toRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  toName: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  toSub: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowTotal: { backgroundColor: 'rgba(124,58,237,0.10)', borderRadius: 14, paddingHorizontal: 12, marginTop: 8 },
  rowLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', flex: 1 },
  rowLabelStrong: { color: colors.textPrimary, fontWeight: '800' },
  rowValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  freePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  freeText: { color: '#16a34a', fontSize: 12, fontWeight: '800' },
  note: { flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginBottom: 10, alignItems: 'flex-start' },
  noteText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  footer: { paddingTop: 8 },
  confirmBtn: {
    height: 56, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cancelBtn: { height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  cancelText: { color: colors.violet, fontSize: 15, fontWeight: '800' },
});
