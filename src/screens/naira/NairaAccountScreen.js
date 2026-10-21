import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Animated, Easing, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';

const SHADOW = '#2a1260';
const money = (n) => '\u20A6' + (Number(n) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400, delay: Math.min(index, 8) * 90, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function NairaAccountScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { portfolio } = useWallet();
  const [copied, setCopied] = useState(false);

  const accountName = ((user && user.firstName) || '') + ' ' + ((user && user.lastName) || '');
  const account = user && user.accountNumber
    ? { accountNumber: user.accountNumber, bankName: user.accountBank, accountName: accountName.trim() || 'UB3 Pay User' }
    : null;
  const bvnVerified = !!(user && user.bvnVerified);
  const bal = portfolio && portfolio.ngnBalance != null ? portfolio.ngnBalance : 0;

  const shareDetails = () => {
    if (account) {
      Share.share({ message: account.accountName + ' - ' + account.accountNumber + ' - ' + account.bankName });
    }
  };

  const copyNumber = async () => {
    if (!account) return;
    await Clipboard.setStringAsync(String(account.accountNumber));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <View style={styles.badge}>
              <Feather name="credit-card" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Naira account</Text>
              <Text style={styles.subtitle}>Fund it by bank transfer. It credits your balance automatically.</Text>
            </View>
          </View>
          <Text style={styles.balLabel}>NAIRA BALANCE</Text>
          <Text style={styles.balAmount} numberOfLines={1} adjustsFontSizeToFit>{money(bal)}</Text>
        </View>

        <View style={styles.body}>
          {account ? (
            <View>
              <Reveal index={0} style={{ marginTop: -34 }}>
                <LinearGradient colors={['#2a0e66', '#5B21B6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bankCard}>
                  <View style={styles.cardGlowA} />
                  <View style={styles.cardGlowB} />
                  <View style={styles.cardTop}>
                    <Text style={styles.cardLabel}>ACCOUNT NUMBER</Text>
                    <Pressable onPress={copyNumber} hitSlop={8} style={styles.cardCopy}>
                      <Feather name={copied ? 'check' : 'copy'} size={14} color="#fff" />
                      <Text style={styles.cardCopyText}>{copied ? 'Copied' : 'Copy'}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.cardNumber} numberOfLines={1} adjustsFontSizeToFit>{account.accountNumber}</Text>
                  <View style={styles.cardBottom}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardSmall}>ACCOUNT NAME</Text>
                      <Text style={styles.cardName} numberOfLines={1}>{account.accountName}</Text>
                    </View>
                    <View style={styles.bankPill}>
                      <Feather name="check-circle" size={13} color="#fff" />
                      <Text style={styles.bankPillText} numberOfLines={1}>{account.bankName}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Reveal>

              <Reveal index={1} style={styles.card}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}><Feather name="home" size={17} color={colors.violet} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Bank</Text>
                    <Text style={styles.detailValue}>{account.bankName}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}><Feather name="user" size={17} color={colors.violet} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Account name</Text>
                    <Text style={styles.detailValue}>{account.accountName}</Text>
                  </View>
                </View>
              </Reveal>

              <Reveal index={2} style={styles.btnRow}>
                <Pressable style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.88 }]} onPress={shareDetails}>
                  <Feather name="share-2" size={18} color="#fff" />
                  <Text style={styles.shareLabel}>Share details</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.88 }]} onPress={copyNumber}>
                  <Feather name={copied ? 'check' : 'copy'} size={18} color={colors.violet} />
                  <Text style={styles.copyLabel}>{copied ? 'Copied' : 'Copy number'}</Text>
                </Pressable>
              </Reveal>
            </View>
          ) : (
            <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={styles.lockCircle}>
                  <Feather name={bvnVerified ? 'clock' : 'shield'} size={30} color={colors.violet} />
                </View>
                <Text style={styles.verifyTitle}>{bvnVerified ? 'Setting up your account' : 'Activate your Naira account'}</Text>
                <Text style={styles.verifyText}>
                  {bvnVerified
                    ? 'Your BVN is verified. Your account number is being set up and will show here soon.'
                    : 'Verify your BVN to activate your Naira account and get your own account number.'}
                </Text>
                {!bvnVerified ? (
                  <Pressable onPress={() => navigation.navigate('VerifyBvn')} style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.88 }]}>
                    <Feather name="shield" size={17} color="#fff" />
                    <Text style={styles.verifyBtnText}>Verify BVN</Text>
                  </Pressable>
                ) : null}
              </View>
            </Reveal>
          )}

          <Reveal index={3}>
            <Pressable onPress={() => navigation.navigate('DepositHistory')} style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.88 }]}>
              <View style={styles.detailIcon}><Feather name="clock" size={17} color={colors.violet} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyText}>View deposit history</Text>
                <Text style={styles.historySub}>See money received into your account</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          </Reveal>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 66, paddingHorizontal: 20, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2, lineHeight: 17 },
  balLabel: { color: '#ddd6fe', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 20 },
  balAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: 4 },
  body: { paddingHorizontal: 20 },
  bankCard: {
    borderRadius: 26, padding: 20, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  cardGlowA: { position: 'absolute', top: -50, right: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.09)' },
  cardGlowB: { position: 'absolute', bottom: -70, left: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(167,139,250,0.30)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  cardCopy: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  cardCopyText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cardNumber: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 3, marginTop: 14 },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 20, gap: 12 },
  cardSmall: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 3 },
  bankPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, maxWidth: '45%' },
  bankPillText: { color: '#fff', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  detailIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailLabel: { color: colors.textSecondary, fontSize: 12 },
  detailValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 18, backgroundColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  shareLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  copyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 18, backgroundColor: colors.bgCard,
    borderWidth: 1.5, borderColor: colors.violet,
  },
  copyLabel: { color: colors.violet, fontWeight: '800', fontSize: 14 },
  lockCircle: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.3)',
  },
  verifyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  verifyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 8, paddingHorizontal: 8 },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', height: 54, borderRadius: 18, backgroundColor: colors.violet, marginTop: 20,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  verifyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 22, padding: 14, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  historyText: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  historySub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
