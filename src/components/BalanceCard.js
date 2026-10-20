import { NotificationDot } from './NotificationIndicators';
import useUb3Id from '../hooks/useUb3Id';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatUsd, formatNgn } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import * as Clipboard from 'expo-clipboard';

const prettyId = (id) => (/^[0-9]{8}$/.test(id || '') ? id.slice(0, 4) + ' ' + id.slice(4) : id ? '@' + id : '\u2014');

export default function BalanceCard({ totalUsd, totalNgn, totalPnl24hUsd = 0, stale = false, navigation }) {
  const ub3Id = useUb3Id();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState('account');
  const account = user && user.accountNumber ? { accountNumber: user.accountNumber, bankName: user.accountBank } : null;
  const [copied, setCopied] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const cardRef = useRef(null);
  const box = useRef(null);
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const rotX = tiltY.interpolate({ inputRange: [-1, 1], outputRange: ['10deg', '-10deg'] });
  const rotY = tiltX.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const applyTilt = (px, py) => {
    const b = box.current;
    if (!b) return;
    tiltX.setValue(clamp((px - (b.x + b.w / 2)) / (b.w / 2)));
    tiltY.setValue(clamp((py - (b.y + b.h / 2)) / (b.h / 2)));
  };
  const onTS = (e) => {
    const px = e.nativeEvent.pageX;
    const py = e.nativeEvent.pageY;
    if (cardRef.current && cardRef.current.measureInWindow) {
      cardRef.current.measureInWindow((x, y, w, h) => { box.current = { x: x, y: y, w: w, h: h }; applyTilt(px, py); });
    }
  };
  const onTM = (e) => applyTilt(e.nativeEvent.pageX, e.nativeEvent.pageY);
  const onTE = () => {
    Animated.spring(tiltX, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }).start();
    Animated.spring(tiltY, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }).start();
  };

  const [disp, setDisp] = useState({ ngn: 0, usd: 0 });
  const prevTotals = useRef({ ngn: 0, usd: 0 });

  useEffect(() => {
    const from = prevTotals.current;
    const to = { ngn: Number(totalNgn) || 0, usd: Number(totalUsd) || 0 };
    prevTotals.current = to;
    const v = new Animated.Value(0);
    const id = v.addListener(({ value }) => setDisp({ ngn: from.ngn + (to.ngn - from.ngn) * value, usd: from.usd + (to.usd - from.usd) * value }));
    const anim = Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: false });
    anim.start();
    return () => { anim.stop(); v.removeListener(id); };
  }, [totalNgn, totalUsd]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pnlPositive = totalPnl24hUsd >= 0;
  const pnlPct = totalUsd > 0 ? (totalPnl24hUsd / (totalUsd - totalPnl24hUsd)) * 100 : 0;
  const ngnRate = totalUsd > 0 ? totalNgn / totalUsd : 0;
  const totalPnl24hNgn = totalPnl24hUsd * ngnRate;
  const shimmerTranslate = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-60, 260] });

  const handleCopy = async () => {
    const value = tab === 'account' ? (account && account.accountNumber) : ub3Id;
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dots = '\u2022\u2022\u2022\u2022\u2022\u2022';
  const acctText = tab === 'account'
    ? (account ? account.accountNumber + ' \u00b7 ' + account.bankName : (user && user.bvnVerified ? 'Account setup pending' : 'Verify your BVN'))
    : prettyId(ub3Id);

  return (
    <Animated.View
      ref={cardRef}
      onTouchStart={onTS}
      onTouchMove={onTM}
      onTouchEnd={onTE}
      onTouchCancel={onTE}
      style={{
        opacity: fade,
        borderRadius: 28,
        backgroundColor: colors.violetDeep,
        shadowColor: colors.violet,
        shadowOpacity: 0.55,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 16 },
        elevation: 16,
        transform: [{ perspective: 900 }, { rotateX: rotX }, { rotateY: rotY }],
      }}
    >
      <Pressable onPress={() => setHidden((h) => !h)}>
        <LinearGradient
          colors={['#2a0e66', '#5B21B6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View pointerEvents="none" style={styles.glowA} />
          <View pointerEvents="none" style={styles.glowB} />
          <View pointerEvents="none" style={styles.ring} />
          <View pointerEvents="none" style={styles.topLine} />
          <Animated.View
            pointerEvents="none"
            style={[styles.sheen, { transform: [{ translateX: shimmerTranslate }, { rotate: '20deg' }] }]}
          />

          <View style={styles.headerRow}>
            <View style={styles.brand}>
              <View style={styles.logoPlate}>
                <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
              </View>
              <Text style={styles.brandText}>UB3 Pay</Text>
            </View>
            <View style={styles.icons}>
              <Pressable onPress={() => navigation && navigation.navigate('AccountSnapshot')} style={styles.cardIconBtn} hitSlop={8}>
                <Feather name="user" size={16} color="#fff" />
              </Pressable>
              <Pressable onPress={() => navigation && navigation.navigate('Notifications')} style={styles.cardIconBtn} hitSlop={8}>
                <Feather name="bell" size={16} color="#fff" />
                <NotificationDot />
              </Pressable>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total balance</Text>
            <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.eyeBtn}>
              <Feather name={hidden ? 'eye-off' : 'eye'} size={15} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.primaryAmount} numberOfLines={1} adjustsFontSizeToFit>{hidden ? dots : formatNgn(disp.ngn)}</Text>
          <Text style={styles.secondaryAmount}>{hidden ? dots : '\u2248 ' + formatUsd(disp.usd)}</Text>

          <View style={styles.pnlRow}>
            <View style={styles.pnlBadge}>
              <Feather name={pnlPositive ? 'trending-up' : 'trending-down'} size={12} color={pnlPositive ? colors.success : colors.danger} />
              <Text style={[styles.pnlText, { color: pnlPositive ? colors.success : colors.danger }]}>
                {hidden ? '----' : (pnlPositive ? '+' : '') + formatNgn(totalPnl24hNgn) + ' (' + (pnlPositive ? '+' : '') + pnlPct.toFixed(2) + '%)'}
              </Text>
            </View>
            <Text style={styles.pnlLabel}>24h</Text>
          </View>

          {stale ? <Text style={styles.staleNote}>Showing last known prices - reconnecting...</Text> : null}

          <View style={styles.acctPanel}>
            <View style={styles.acctTabs}>
              <Pressable onPress={() => setTab('account')} style={[styles.acctTab, tab === 'account' && styles.acctTabActive]}>
                <Text style={[styles.acctTabText, tab === 'account' && { color: colors.violetDeep }]}>Account</Text>
              </Pressable>
              <Pressable onPress={() => setTab('uid')} style={[styles.acctTab, tab === 'uid' && styles.acctTabActive]}>
                <Text style={[styles.acctTabText, tab === 'uid' && { color: colors.violetDeep }]}>UB3 ID</Text>
              </Pressable>
            </View>
            <Pressable style={styles.acctValueRow} onPress={handleCopy} hitSlop={8}>
              <Text style={styles.acctValue} numberOfLines={1}>{acctText}</Text>
              <View style={styles.copyChip}>
                <Feather name={copied ? 'check' : 'copy'} size={13} color="#fff" />
              </View>
            </Pressable>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20, paddingTop: 16, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(167,139,250,0.28)' },
  ring: { position: 'absolute', right: -24, top: 78, width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  topLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  sheen: { position: 'absolute', top: -60, bottom: -60, width: 50, backgroundColor: 'rgba(255,255,255,0.07)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoPlate: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 28, height: 28 },
  brandText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  icons: { flexDirection: 'row', gap: 8 },
  cardIconBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  eyeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  primaryAmount: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 6 },
  secondaryAmount: { color: 'rgba(255,255,255,0.82)', fontSize: 15, fontWeight: '600', marginTop: 2 },
  pnlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  pnlBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.28)' },
  pnlText: { fontSize: 12, fontWeight: '700' },
  pnlLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  staleNote: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 10 },
  acctPanel: { marginTop: 16, padding: 12, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  acctTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  acctTab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  acctTabActive: { backgroundColor: 'rgba(255,255,255,0.92)' },
  acctTabText: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '800' },
  acctValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  acctValue: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1, flexShrink: 1 },
  copyChip: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
});
