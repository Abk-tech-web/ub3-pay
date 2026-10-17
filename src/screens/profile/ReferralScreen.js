import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Share, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { apiGet, apiPost } from '../../services/api';
import PinGate from '../../components/PinGate';
import PrimaryButton from '../../components/PrimaryButton';

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

export default function ReferralScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Invite & Earn</Text>
        <View style={{ width: 36 }} />
      </View>

      {!data && !loadErr ? (
        <View style={styles.center}><ActivityIndicator color={colors.violet} /></View>
      ) : null}

      {!data && loadErr ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{loadErr}</Text>
          <Pressable onPress={load} style={{ marginTop: spacing(3) }}>
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {data ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />}
        >
          {cfg.promoLeft > 0 ? (
            <View style={styles.promo}>
              <Feather name="zap" size={16} color="#fbbf24" />
              <Text style={styles.promoText}>
                Launch bonus: limited spots available. Sign up with a code and verify your BVN to get {naira(cfg.inviteeAirtimeNgn)} airtime instantly.
              </Text>
            </View>
          ) : null}

          <LinearGradient colors={['#7C3AED', '#4C1D95']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroLabel}>YOUR REFERRAL CODE</Text>
            <Text style={styles.heroCode}>{code || '-'}</Text>
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
          </LinearGradient>

          {data.referredByCode ? (
            <Text style={styles.invitedBy}>You joined with code {data.referredByCode}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{data.invited || 0}</Text>
              <Text style={styles.statLabel}>Invited</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{data.qualified || 0}</Text>
              <Text style={styles.statLabel}>Qualified</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{naira(data.earnedNgn)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.balRow}>
              <View>
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
            {doneMsg ? <Text style={styles.okText}>{doneMsg}</Text> : null}

            {claimOpen ? (
              <View style={{ marginTop: spacing(4) }}>
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
                {formErr ? <Text style={styles.errText}>{formErr}</Text> : null}
                <PrimaryButton title={'Claim ' + naira(available) + ' airtime'} onPress={startClaim} />
              </View>
            ) : formErr ? <Text style={[styles.errText, { marginTop: spacing(3) }]}>{formErr}</Text> : null}
          </View>

          <Text style={styles.section}>How it works</Text>
          <View style={styles.card}>
            {[
              'Share your code with friends.',
              'They enter it when creating their UB3 Pay account.',
              'While the launch bonus lasts, rewards unlock the moment they verify their BVN. After that, rewards unlock on their first transaction of $' + (cfg.minTxUsd || 20) + ' or more.',
              'Claim your airtime reward here anytime with your PIN.',
            ].map((t, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepDot}><Text style={styles.stepNum}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Rewards</Text>
          <View style={styles.card}>
            {rewards.length === 0 ? <Text style={styles.empty}>No rewards yet. Share your code to get started.</Text> : null}
            {rewards.map((r, i) => {
              const chip = statusChip(r.status);
              return (
                <View key={r.id || i} style={[styles.listRow, i !== rewards.length - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{r.role === 'inviter' ? 'A friend joined' : 'Welcome reward'}</Text>
                    <Text style={[styles.chip, { color: chip.color }]}>{chip.text}</Text>
                  </View>
                  <Text style={styles.listAmt}>{naira(r.amountNgn)}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.section}>Friends you invited</Text>
          <View style={styles.card}>
            {invitees.length === 0 ? <Text style={styles.empty}>Nobody has used your code yet.</Text> : null}
            {invitees.map((p, i) => {
              const chip = statusChip(p.status);
              return (
                <View key={i} style={[styles.listRow, i !== invitees.length - 1 && styles.rowBorder]}>
                  <Text style={[styles.listTitle, { flex: 1 }]} numberOfLines={1}>{p.email || p.inviteeEmail || p.masked || 'Friend'}</Text>
                  <Text style={[styles.chip, { color: chip.color }]}>{chip.text}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      <PinGate
        visible={gateOpen}
        busy={busy}
        errorCode={pinErrCode}
        onSubmit={onPin}
        onCancel={() => setGateOpen(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(4), paddingVertical: spacing(3) },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
  scroll: { padding: spacing(4), paddingBottom: spacing(12) },
  promo: { flexDirection: 'row', gap: spacing(2), backgroundColor: '#fbbf2422', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(4), alignItems: 'flex-start' },
  promoText: { color: colors.textPrimary, fontSize: 13, flex: 1, lineHeight: 19 },
  hero: { borderRadius: radii.lg, padding: spacing(6), alignItems: 'center' },
  heroLabel: { color: '#ddd6fe', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  heroCode: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 3, marginTop: spacing(2) },
  heroSub: { color: '#ede9fe', fontSize: 13, textAlign: 'center', marginTop: spacing(2), lineHeight: 19 },
  heroBtns: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(5) },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing(5), height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#ffffff66' },
  heroBtnSolid: { backgroundColor: '#fff', borderColor: '#fff' },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  invitedBy: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: spacing(3) },
  statsRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(4) },
  stat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing(4), alignItems: 'center' },
  statNum: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing(4), marginTop: spacing(4) },
  balRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balLabel: { color: colors.textSecondary, fontSize: 13 },
  balAmount: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 },
  claimBtn: { backgroundColor: colors.violet, borderRadius: 20, paddingHorizontal: spacing(6), height: 40, alignItems: 'center', justifyContent: 'center' },
  claimBtnText: { color: '#fff', fontWeight: '700' },
  okText: { color: '#34d399', fontSize: 13, marginTop: spacing(3) },
  errText: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(1.5) },
  netRow: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(4), flexWrap: 'wrap' },
  netChip: { paddingHorizontal: spacing(4), height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  netChipOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  netText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: colors.bg, color: colors.textPrimary, borderRadius: radii.md, paddingHorizontal: spacing(4), height: 50, marginBottom: spacing(4), borderWidth: 1, borderColor: colors.border },
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: spacing(6) },
  stepRow: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(3), alignItems: 'flex-start' },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7C3AED33', alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: colors.violetSoft, fontWeight: '800', fontSize: 12 },
  stepText: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 19 },
  empty: { color: colors.textSecondary, fontSize: 13 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3), gap: spacing(3) },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  listTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  listAmt: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  chip: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  link: { color: colors.violetSoft, fontWeight: '600' },
});
