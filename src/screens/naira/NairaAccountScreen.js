import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';

function Reveal({ index, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function NairaAccountScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const accountName = ((user && user.firstName) || '') + ' ' + ((user && user.lastName) || '');
  const account = user && user.accountNumber ? { accountNumber: user.accountNumber, bankName: user.accountBank, accountName: accountName.trim() || 'UB3 Pay User' } : null;

  const shareDetails = () => {
    if (account) {
      Share.share({ message: account.accountName + ' - ' + account.accountNumber + ' - ' + account.bankName });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Reveal index={0} style={styles.headerRow}>
          <View style={styles.badge}>
            <Feather name="credit-card" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing(4) }}>
            <Text style={styles.title}>Your Naira account</Text>
            <Text style={styles.subtitle}>Fund this account by bank transfer, it credits your balance automatically.</Text>
          </View>
        </Reveal>

        {account ? (
          <View>
            <Reveal index={1} style={styles.hero}>
              <View style={styles.heroGlow} />
              <Text style={styles.heroLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.heroNumber}>{account.accountNumber}</Text>
              <View style={styles.heroBankPill}>
                <Feather name="check-circle" size={13} color="#fff" />
                <Text style={styles.heroBankText}>{account.bankName}</Text>
              </View>
            </Reveal>

            <Reveal index={2} style={styles.card}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}><Feather name="home" size={16} color={colors.violet} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Bank</Text>
                  <Text style={styles.cardValue}>{account.bankName}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}><Feather name="user" size={16} color={colors.violet} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Account name</Text>
                  <Text style={styles.cardValue}>{account.accountName}</Text>
                </View>
              </View>
            </Reveal>

            <Reveal index={3}>
              <Pressable style={({ pressed }) => [styles.shareBtn, pressed ? styles.pressed : null]} onPress={shareDetails}>
                <Feather name="share-2" size={18} color="#fff" />
                <Text style={styles.shareLabel}>Share account details</Text>
              </Pressable>
            </Reveal>
          </View>
        ) : (
          <Reveal index={1} style={styles.card}>
            <View style={{ alignItems: 'center', paddingVertical: spacing(4) }}>
              <View style={styles.lockCircle}>
                <Feather name="shield" size={28} color={colors.violet} />
              </View>
              <Text style={styles.verifyText}>Verify your BVN to activate your Naira account.</Text>
              <Pressable onPress={() => navigation.navigate('VerifyBvn')} style={({ pressed }) => [styles.verifyBtn, pressed ? styles.pressed : null]}>
                <Text style={styles.verifyBtnText}>Verify BVN</Text>
              </Pressable>
            </View>
          </Reveal>
        )}

        <Reveal index={4}>
          <Pressable onPress={() => navigation.navigate('DepositHistory')} style={({ pressed }) => [styles.historyCard, pressed ? styles.pressed : null]}>
            <View style={styles.detailIcon}><Feather name="clock" size={16} color={colors.violet} /></View>
            <Text style={styles.historyText}>View deposit history</Text>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const SHADOW = '#2a1260';

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(6) },
  badge: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  hero: {
    backgroundColor: '#4C1D95', borderRadius: 26, padding: spacing(6), overflow: 'hidden', marginBottom: spacing(4),
    shadowColor: SHADOW, shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  heroGlow: { position: 'absolute', top: -50, right: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(167,139,250,0.28)' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  heroNumber: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 2, marginTop: spacing(2) },
  heroBankPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: spacing(4), gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  heroBankText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4), marginBottom: spacing(4),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(2) },
  detailIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3),
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing(1), opacity: 0.6 },
  cardLabel: { color: colors.textSecondary, fontSize: 12 },
  cardValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.violet,
    borderRadius: radii.pill, paddingVertical: spacing(4), marginBottom: spacing(4),
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  shareLabel: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  lockCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing(3),
  },
  verifyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: spacing(4) },
  verifyBtn: {
    backgroundColor: colors.violet, paddingVertical: spacing(3), paddingHorizontal: spacing(8), borderRadius: radii.pill,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 8,
  },
  verifyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 6,
  },
  historyText: { flex: 1, color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
});
