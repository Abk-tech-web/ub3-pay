import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Share, TextInput, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { apiGet, apiPost } from '../../services/api';
import PinGate from '../../components/PinGate';
import UB3Loader from '../../components/UB3Loader';

const SHADOW = '#2a1260';
const NETWORKS = [
  { label: 'MTN', id: 'mtn' },
  { label: 'Glo', id: 'glo' },
  { label: 'Airtel', id: 'airtel' },
  { label: '9mobile', id: 'etisalat' },
];
const PIN_CODES = ['PIN_INVALID', 'PIN_LOCKED', 'PIN_NOT_SET', 'PIN_REQUIRED'];
const CLAIM_ERR = {
  invalid_phone: 'Enter a valid 11-digit phone number starting with 0.',
  invalid_network: 'Pick a network.',
  nothing_to_claim: 'You have no reward to claim right now.',
  purchase_failed: 'The airtime purchase failed. Your reward is safe, please try again.',
};

const naira = (n) => '\u20A6' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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

export default function ReferralScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [net, setNet] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [formErr, setFormErr] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pinErrCode, setPinErrCode] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(async () => {
    try {
      const d = await apiGet('/referral/me');
      setData(d);
      setLoadErr('');
    } catch (e) {
      setLoadErr(e.message || 'Could not load your referral details.');
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const cfg = (data && data.config) || {};
  const code = data && data.code;

  const copyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareCode = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: 'Join me on UB3 Pay. Use my referral code ' + code + ' when you sign up and earn ' + naira(cfg.inviteeAirtimeNgn || 200) + ' airtime.',
      });
    } catch (e) {}
  };

  const startClaim = () => {
    setFormErr('');
    setDoneMsg('');
    if (!/^0\d{10}$/.test(phone)) return setFormErr(CLAIM_ERR.invalid_phone);
    setPinErrCode('');
    setGateOpen(true);
  };

  const onPin = async (pin) => {
    setPinErrCode('');
    setBusy(true);
    try {
      await apiPost('/referral/claim', { phone, serviceID: net, pin });
      setBusy(false);
      setGateOpen(false);
      setClaimOpen(false);
      setDoneMsg('Airtime sent to ' + phone + '.');
      setPhone('');
      load();
    } catch (err) {
      setBusy(false);
      const c = err.code || err.message;
      if (PIN_CODES.includes(c)) {
        setPinErrCode(c);
        return;
      }
      setGateOpen(false);
      setFormErr(CLAIM_ERR[c] || err.message || 'Claim failed. Try again.');
    }
  };

  const statusChip = (status) => {
    if (status === 'available') return { text: 'Ready', color: '#34d399' };
    if (status === 'claiming') return { text: 'Processing', color: '#fbbf24' };
    if (status === 'claimed') return { text: 'Claimed', color: colors.textSecondary };
    if (status === 'qualified') return { text: 'Rewarded', color: '#34d399' };
    return { text: 'Pending', color: '#fbbf24' };
  };

  const rewards = (data && data.rewards) || [];
  const invitees = (data && data.invitees) || [];
  const available = (data && data.availableNgn) || 0;

  const BackBtn = ({ solid }) => (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={10}
      style={[styles.backBtn, solid && { backgroundColor: '#4C1D95' }]}
    >
      <Feather name="chevron-left" size={22} color="#FFFFFF" />
    </Pressable>
  );

  if (!data) {
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
              <Text style={styles.errText}>{loadErr}</Text>
              <Pressable onPress={load} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <BackBtn />
            <Text style={styles.heroTitle}>Invite & Earn</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.giftCircle}>
            <Feather name="gift" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.heroLabel}>YOUR REFERRAL CODE</Text>
          <View style={styles.codePill}>
            <Text style={styles.heroCode}>{code || '-'}</Text>
          </View>
          <Text style={styles.heroSub}>
            Friends get {naira(cfg.inviteeAirtimeNgn)} airtime. You earn {naira(cfg.inviterAirtimeNgn)} for every friend.
          </Text>
          <View style={styles.heroBtns}>
            <Pressable style={styles.heroBtn} onPress={copyCode}>
              <Feather name={copied ? 'check' : 'copy'} size={16} color="#fff" />
              <Text style={styles.heroBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
            <Pressable style={[styles.heroBtn, styles.heroBtnSolid]} onPress={shareCode}>
              <Feather name="share-2" size={16} color="#4C1D95" />
              <Text style={[styles.heroBtnText, { color: '#4C1D95' }]}>Share</Text>
            </Pressable>
          </View>
        </View>

        <Reveal index={0} style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{data.invited || 0}</Text>
            <Text style={styles.statLabel}>Invited</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{data.qualified || 0}</Text>
            <Text style={styles.statLabel}>Qualified</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>{naira(data.earnedNgn)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </Reveal>

        <View style={styles.body}>
          {data.referredByCode ? (
            <Text style={styles.invitedBy}>You joined with code {data.referredByCode}</Text>
          ) : null}

          {cfg.promoLeft > 0 ? (
            <Reveal index={1} style={styles.promo}>
              <View style={styles.promoIcon}>
                <Feather name="zap" size={16} color="#fbbf24" />
              </View>
              <Text style={styles.promoText}>
                Launch bonus: limited spots available. Sign up with a code and verify your BVN to get {naira(cfg.inviteeAirtimeNgn)} airtime instantly.
              </Text>
            </Reveal>
          ) : null}

          <Reveal index={2} style={styles.card}>
            <View style={styles.balRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balLabel}>Available airtime reward</Text>
                <Text style={styles.balAmount}>{naira(available)}</Text>
              </View>
              <Pressable
                style={[styles.claimBtn, available <= 0 && { opacity: 0.4 }]}
                disabled={available <= 0}
                onPress={() => { setClaimOpen((v) => !v); setFormErr(''); setDoneMsg(''); }}
              >
                <Text style={styles.claimBtnText}>{claimOpen ? 'Close' : 'Claim'}</Text>
              </Pressable>
            </View>

            {doneMsg ? (
              <View style={styles.okBox}>
                <Feather name="check-circle" size={16} color="#34d399" />
                <Text style={styles.okText}>{doneMsg}</Text>
              </View>
            ) : null}

            {claimOpen ? (
              <View style={{ marginTop: 18 }}>
                <Text style={styles.label}>Network</Text>
                <View style={styles.netRow}>
                  {NETWORKS.map((n) => (
                    <Pressable key={n.id} onPress={() => setNet(n.id)} style={[styles.netChip, net === n.id && styles.netChipOn]}>
                      <Text style={[styles.netText, net === n.id && { color: '#fff' }]}>{n.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="08012345678"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                />
                {formErr ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorBoxText}>{formErr}</Text>
                  </View>
                ) : null}
                <Pressable style={({ pressed }) => [styles.bigBtn, pressed && { opacity: 0.85 }]} onPress={startClaim}>
                  <Text style={styles.bigBtnText}>{'Claim ' + naira(available) + ' airtime'}</Text>
                </Pressable>
              </View>
            ) : formErr ? (
              <View style={[styles.errorBox, { marginTop: 14 }]}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorBoxText}>{formErr}</Text>
              </View>
            ) : null}
          </Reveal>

          <Reveal index={3}>
            <Text style={styles.section}>How it works</Text>
            <View style={styles.card}>
              {[
                'Share your code with friends.',
                'They enter it when creating their UB3 Pay account.',
                'While the launch bonus lasts, rewards unlock the moment they verify their BVN. After that, rewards unlock on their first transaction of $' + (cfg.minTxUsd || 20) + ' or more.',
                'Claim your airtime reward here anytime with your PIN.',
              ].map((t, i, arr) => (
                <View key={i} style={[styles.stepRow, i === arr.length - 1 && { marginBottom: 0 }]}>
                  <View style={styles.stepDot}><Text style={styles.stepNum}>{i + 1}</Text></View>
                  <Text style={styles.stepText}>{t}</Text>
                </View>
              ))}
            </View>
          </Reveal>

          <Reveal index={4}>
            <Text style={styles.section}>Rewards</Text>
            <View style={styles.card}>
              {rewards.length === 0 ? <Text style={styles.empty}>No rewards yet. Share your code to get started.</Text> : null}
              {rewards.map((r, i) => {
                const chip = statusChip(r.status);
                return (
                  <View key={r.id || i} style={[styles.listRow, i !== rewards.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{r.role === 'inviter' ? 'A friend joined' : 'Welcome reward'}</Text>
                      <View style={[styles.chip, { backgroundColor: chip.color + '22' }]}>
                        <Text style={[styles.chipText, { color: chip.color }]}>{chip.text}</Text>
                      </View>
                    </View>
                    <Text style={styles.listAmt}>{naira(r.amountNgn)}</Text>
                  </View>
                );
              })}
            </View>
          </Reveal>

          <Reveal index={5}>
            <Text style={styles.section}>Friends you invited</Text>
            <View style={styles.card}>
              {invitees.length === 0 ? <Text style={styles.empty}>Nobody has used your code yet.</Text> : null}
              {invitees.map((p, i) => {
                const chip = statusChip(p.status);
                return (
                  <View key={i} style={[styles.listRow, i !== invitees.length - 1 && styles.rowBorder]}>
                    <View style={styles.avatar}>
                      <Feather name="user" size={16} color={colors.violet} />
                    </View>
                    <Text style={[styles.listTitle, { flex: 1 }]} numberOfLines={1}>
                      {p.email || p.inviteeEmail || p.masked || 'Friend'}
                    </Text>
                    <View style={[styles.chip, { backgroundColor: chip.color + '22', marginTop: 0 }]}>
                      <Text style={[styles.chipText, { color: chip.color }]}>{chip.text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Reveal>
        </View>
      </ScrollView>

      <PinGate
        visible={gateOpen}
        busy={busy}
        errorCode={pinErrCode}
        onSubmit={onPin}
        onCancel={() => setGateOpen(false)}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hero: {
    backgroundColor: '#4C1D95', paddingBottom: 64, borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
    overflow: 'hidden', alignItems: 'center',
  },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  giftCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroLabel: { color: '#ddd6fe', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  codePill: {
    marginTop: 10, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  heroCode: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 3 },
  heroSub: { color: '#ede9fe', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19, paddingHorizontal: 28 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroBtnSolid: { backgroundColor: '#fff', borderColor: '#fff' },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: -34, paddingHorizontal: 20 },
  stat: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  statNum: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  body: { paddingHorizontal: 20, paddingTop: 6 },
  invitedBy: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 14 },
  promo: {
    flexDirection: 'row', gap: 10, backgroundColor: 'rgba(251,191,36,0.14)', borderRadius: 18, padding: 14, marginTop: 18, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  promoIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(251,191,36,0.2)', alignItems: 'center', justifyContent: 'center' },
  promoText: { color: colors.textPrimary, fontSize: 13, flex: 1, lineHeight: 19 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  balRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balLabel: { color: colors.textSecondary, fontSize: 13 },
  balAmount: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 2 },
  claimBtn: {
    backgroundColor: colors.violet, borderRadius: 22, paddingHorizontal: 26, height: 44, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  claimBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  okBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(52,211,153,0.14)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  okText: { color: '#34d399', fontSize: 13, fontWeight: '600', flex: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  errorBoxText: { color: colors.danger, fontSize: 13, flex: 1 },
  errText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 14, paddingHorizontal: 22, height: 42, borderRadius: 21, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontWeight: '700' },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  netRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  netChip: { paddingHorizontal: 18, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  netChipOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  netText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  input: {
    backgroundColor: colors.bg, color: colors.textPrimary, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  section: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 26, marginLeft: 4 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 12 },
  stepText: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 20 },
  empty: { color: colors.textSecondary, fontSize: 13 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  listTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  listAmt: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  chip: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 5 },
  chipText: { fontSize: 11, fontWeight: '800' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center' },
});
