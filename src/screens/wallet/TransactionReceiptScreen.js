import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, Linking, ScrollView, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import PrimaryButton from '../../components/PrimaryButton';

const UB3_LOGO = require('../../assets/images/logo.png');
const SHADOW = '#2a1260';

function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return weekday + ', ' + monthDay + '  \u2022  ' + time;
}

function statusInfo(status) {
  const s = String(status || 'success').toLowerCase();
  if (s === 'pending' || s === 'processing') return { color: '#f59e0b', icon: 'time-outline', label: 'Pending' };
  if (s === 'failed' || s === 'error') return { color: '#ef4444', icon: 'close', label: 'Failed' };
  return { color: '#22C55E', icon: 'checkmark', label: 'Successful' };
}

export default function TransactionReceiptScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const {
    amountPrefix = '',
    amount,
    topRightLabel,
    topRightIcon = 'business-outline',
    topRightImage,
    rows = [],
    explorerUrl,
    date,
    status,
  } = route.params;

  const [sharing, setSharing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const shotRef = useRef();
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const st = statusInfo(status);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }).start();
    Animated.timing(fade, { toValue: 1, duration: 450, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const onDone = () => {
    if (route.params && route.params.dismissTo) {
      navigation.navigate(route.params.dismissTo);
    } else {
      navigation.goBack();
    }
  };

  const openExplorer = () => {
    if (explorerUrl) Linking.openURL(explorerUrl);
  };

  const copy = async (value, i) => {
    await Clipboard.setStringAsync(value);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(-1), 1400);
  };

  const onShare = async () => {
    try {
      setSharing(true);
      const uri = await shotRef.current.capture();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share receipt' });
      }
    } catch (e) {
      console.error('Share failed', e);
    } finally {
      setSharing(false);
    }
  };

  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const slideY = fade.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shotWrap}>
          <View style={styles.card}>
            <View style={styles.hero}>
              <View style={styles.glowA} />
              <View style={styles.glowB} />
              <View style={styles.headerRow}>
                <View style={styles.brandRow}>
                  <Image source={UB3_LOGO} style={styles.brandLogo} resizeMode="contain" />
                  <Text style={styles.brandText}>UB3 Pay</Text>
                </View>
                <View style={styles.topRightPill}>
                  {topRightImage ? (
                    <Image source={{ uri: topRightImage }} style={styles.topRightImg} />
                  ) : (
                    <Ionicons name={topRightIcon} size={14} color="#fff" />
                  )}
                  <Text style={styles.topRightText} numberOfLines={1}>{topRightLabel}</Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.statusCircle,
                  { backgroundColor: st.color, shadowColor: st.color, opacity: pop, transform: [{ scale: popScale }] },
                ]}
              >
                <Ionicons name={st.icon} size={38} color="#fff" />
              </Animated.View>
              <Text style={styles.statusLabel}>{st.label}</Text>
              <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>{amountPrefix}{amount}</Text>
              <Text style={styles.dateTime}>{formatDateTime(date ? new Date(date) : new Date())}</Text>
            </View>

            <Animated.View style={[styles.body, { opacity: fade, transform: [{ translateY: slideY }] }]}>
              <View style={[styles.notch, { left: -11 }]} />
              <View style={[styles.notch, { right: -11 }]} />
              {rows.map((row, i) => (
                <View key={i}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <View style={styles.rowValueRow}>
                    <Text style={styles.rowValue}>{row.value}</Text>
                    {row.copyValue && !sharing ? (
                      <Pressable hitSlop={8} style={styles.copyBtn} onPress={() => copy(row.copyValue, i)}>
                        <Ionicons
                          name={copiedIdx === i ? 'checkmark' : 'copy-outline'}
                          size={15}
                          color={copiedIdx === i ? '#22C55E' : colors.violet}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  {i < rows.length - 1 ? (
                    <View style={styles.dashWrap}>
                      <View style={styles.dashLine} />
                    </View>
                  ) : null}
                </View>
              ))}
            </Animated.View>
          </View>
        </ViewShot>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.actionRow}>
          {explorerUrl ? (
            <Pressable style={({ pressed }) => [styles.actionBtn, styles.explorerBtn, pressed && { opacity: 0.85 }]} onPress={openExplorer}>
              <Ionicons name="open-outline" size={16} color="#fff" />
              <Text style={styles.explorerLabel} numberOfLines={1} adjustsFontSizeToFit>View on Block Explorer</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.shareBtn, pressed && { opacity: 0.85 }]}
            onPress={onShare}
            disabled={sharing}
          >
            <Ionicons name="share-outline" size={17} color={colors.textPrimary} />
            <Text style={styles.shareLabel} numberOfLines={1} adjustsFontSizeToFit>{sharing ? 'Preparing...' : 'Share Receipt'}</Text>
          </Pressable>
        </View>
        <PrimaryButton title="Done" onPress={onDone} />
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  shotWrap: { backgroundColor: colors.bg },
  card: {
    borderRadius: 28, overflow: 'hidden', backgroundColor: colors.bgCard,
    shadowColor: SHADOW, shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  hero: { backgroundColor: '#4C1D95', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, alignItems: 'center', overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -70, left: -50, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(139,92,246,0.35)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', marginBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 36, height: 36, borderRadius: 10 },
  brandText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  topRightPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6, maxWidth: '55%',
  },
  topRightImg: { width: 16, height: 16, borderRadius: 8 },
  topRightText: { color: '#fff', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  statusCircle: {
    width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  statusLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '800', letterSpacing: 1.2, marginTop: 14, textTransform: 'uppercase' },
  amount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 6, maxWidth: '100%' },
  dateTime: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '600', marginTop: 8 },
  body: { backgroundColor: colors.bgCard, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 14 },
  notch: { position: 'absolute', top: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bg },
  rowLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  rowValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  copyBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center',
  },
  dashWrap: { height: 1, overflow: 'hidden', marginBottom: 14 },
  dashLine: { height: 2, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 18, paddingHorizontal: 12,
  },
  explorerBtn: {
    backgroundColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  explorerLabel: { color: '#fff', fontWeight: '800', fontSize: 13, flexShrink: 1 },
  shareBtn: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  shareLabel: { color: colors.textPrimary, fontWeight: '800', fontSize: 13, flexShrink: 1 },
});
