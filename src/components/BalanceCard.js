import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { radii, spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';
import { formatUsd, formatNgn } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { getNairaAccount } from '../services/baasService';
import * as Clipboard from 'expo-clipboard';

export default function BalanceCard({ totalUsd, totalNgn, totalPnl24hUsd = 0, stale = false }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState('account');
  const [account, setAccount] = useState(null);
  const [copied, setCopied] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (user) {
      getNairaAccount(user.uid).then(setAccount).catch(() => {});
    }
  }, [user]);

  const pnlPositive = totalPnl24hUsd >= 0;
  const pnlPct = totalUsd > 0 ? (totalPnl24hUsd / (totalUsd - totalPnl24hUsd)) * 100 : 0;
  const ngnRate = totalUsd > 0 ? totalNgn / totalUsd : 0;
  const totalPnl24hNgn = totalPnl24hUsd * ngnRate;

  const shimmerTranslate = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });

  const handleCopy = async () => {
    const value = tab === 'account' ? account?.accountNumber : user?.uid;
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Animated.View style={{ opacity: fade }}>
      <Pressable onPress={() => setHidden((h) => !h)}>
        <LinearGradient
          colors={[colors.violetDeep, colors.violet, '#3A1F6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.sheen, { transform: [{ translateX: shimmerTranslate }, { rotate: '20deg' }] }]}
          />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total balance</Text>
            <View style={styles.hideRow}>
              <Feather name={hidden ? 'eye-off' : 'eye'} size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.toggle}>{hidden ? 'Hidden' : 'Tap to hide'}</Text>
            </View>
          </View>

          <Text style={styles.primaryAmount}>{hidden ? '\u2022\u2022\u2022\u2022\u2022\u2022' : formatNgn(totalNgn)}</Text>
          <Text style={styles.secondaryAmount}>{hidden ? '\u2022\u2022\u2022\u2022\u2022\u2022' : formatUsd(totalUsd)}</Text>

          <View style={styles.pnlRow}>
            <View style={[styles.pnlBadge, pnlPositive ? styles.pnlUp : styles.pnlDown]}>
              <Feather name={pnlPositive ? 'trending-up' : 'trending-down'} size={12} color={pnlPositive ? colors.success : colors.danger} />
              <Text style={[styles.pnlText, { color: pnlPositive ? colors.success : colors.danger }]}>
                {hidden ? '----' : `${pnlPositive ? '+' : ''}${formatNgn(totalPnl24hNgn)} (${pnlPositive ? '+' : ''}${pnlPct.toFixed(2)}%)`}
              </Text>
            </View>
            <Text style={styles.pnlLabel}>24h</Text>
          </View>

          {stale ? <Text style={styles.staleNote}>Showing last known prices - reconnecting...</Text> : null}

          <View style={styles.acctRow}>
            <View style={styles.acctTabs}>
              <Pressable onPress={() => setTab('account')} style={[styles.acctTab, tab === 'account' && styles.acctTabActive]}>
                <Text style={[styles.acctTabText, tab === 'account' && { color: colors.violetDeep }]}>Account</Text>
              </Pressable>
              <Pressable onPress={() => setTab('uid')} style={[styles.acctTab, tab === 'uid' && styles.acctTabActive]}>
                <Text style={[styles.acctTabText, tab === 'uid' && { color: colors.violetDeep }]}>UID</Text>
              </Pressable>
            </View>
            <Pressable style={styles.acctValueRow} onPress={handleCopy} hitSlop={8}>
              <Text style={styles.acctValue} numberOfLines={1}>
                {tab === 'account'
                  ? (account ? `${account.accountNumber} \u00b7 ${account.bankName}` : 'Loading...')
                  : (user?.uid || '\u2014')}
              </Text>
              <Feather name={copied ? 'check' : 'copy'} size={14} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing(6),
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: -60, bottom: -60, width: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  hideRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  toggle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  primaryAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: spacing(2) },
  secondaryAmount: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: spacing(1) },
  pnlRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing(4), gap: spacing(2) },
  pnlBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1), borderRadius: radii.pill, backgroundColor: 'rgba(0,0,0,0.25)' },
  pnlUp: {},
  pnlDown: {},
  pnlText: { fontSize: 12, fontWeight: '700' },
  pnlLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  staleNote: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: spacing(3) },
  acctRow: {
    marginTop: spacing(4),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  acctTabs: { flexDirection: 'row', gap: 6, marginBottom: spacing(2) },
  acctTab: { paddingHorizontal: spacing(2.5), paddingVertical: 4, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  acctTabActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  acctTabText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  acctValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acctValue: { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
