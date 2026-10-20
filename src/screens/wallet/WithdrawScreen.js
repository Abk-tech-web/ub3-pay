import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Animated, Easing } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import { apiGet } from '../../services/api';

const SHADOW = '#2a1260';
const naira = (n) => '\u20A6' + Math.round(Number(n) || 0).toLocaleString('en-NG');
const nairaDec = (n) => '\u20A6' + (Number(n) || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Reveal({ index = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380, delay: Math.min(index, 8) * 90, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function WithdrawScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { portfolio } = useWallet();
  const [uid, setUid] = useState('');
  const [perTx, setPerTx] = useState(1000000);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    let alive = true;
    apiGet('/limits')
      .then((r) => { if (alive && r && r.limits && r.limits.ngn && r.limits.ngn.perTx) setPerTx(r.limits.ngn.perTx); })
      .catch(() => {});
    return () => { alive = false; };
  }, []));

  const bal = portfolio && portfolio.ngnBalance != null ? portfolio.ngnBalance : null;

  const onSendToUid = () => {
    Alert.alert('Coming soon', 'Sending to a UB3 Pay UID is not available yet.');
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTitle}>Withdraw</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.iconCircle}>
            <Feather name="arrow-up-right" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.heroBal} numberOfLines={1} adjustsFontSizeToFit>{bal === null ? '...' : nairaDec(bal)}</Text>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <Pressable
              style={({ pressed }) => [styles.bankRow, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('BankAccount')}
            >
              <View style={styles.bankIcon}>
                <Feather name="briefcase" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optTitle}>Withdraw to bank account</Text>
                <Text style={styles.optSub}>Choose a bank and account number</Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.textSecondary} />
            </Pressable>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Feather name="zap" size={12} color={colors.violet} />
                <Text style={styles.tagText}>Fee from {'\u20A6'}25</Text>
              </View>
              <View style={styles.tag}>
                <Feather name="shield" size={12} color={colors.violet} />
                <Text style={styles.tagText}>Up to {naira(perTx)} per withdrawal</Text>
              </View>
            </View>
          </Reveal>

          <Reveal index={1} style={styles.card}>
            <View style={styles.uidHead}>
              <View style={[styles.bankIcon, { backgroundColor: 'rgba(124,58,237,0.16)' }]}>
                <Feather name="at-sign" size={22} color={colors.violet} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optTitle}>Send to a UB3 Pay user</Text>
                <Text style={styles.optSub}>Send directly with their UB3 ID</Text>
              </View>
              <View style={styles.soon}>
                <Text style={styles.soonText}>COMING SOON</Text>
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.at}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter UB3 ID"
                placeholderTextColor={colors.textSecondary}
                value={uid}
                onChangeText={setUid}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable
              onPress={onSendToUid}
              disabled={uid.trim().length === 0}
              style={({ pressed }) => [styles.bigBtn, uid.trim().length === 0 && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.bigBtnText}>Send to UB3 ID</Text>
            </Pressable>
          </Reveal>

          <Reveal index={2} style={styles.note}>
            <Feather name="lock" size={15} color={colors.violet} />
            <Text style={styles.noteText}>Every withdrawal is approved with your 4-digit transaction PIN.</Text>
          </Reveal>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 66, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden', alignItems: 'center' },
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
  heroLabel: { color: '#ddd6fe', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroBal: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 6, paddingHorizontal: 30 },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, marginTop: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bankIcon: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.violet, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  optTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  optSub: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { color: colors.violet, fontSize: 12, fontWeight: '800' },
  uidHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  soon: { backgroundColor: 'rgba(245,158,11,0.16)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  soonText: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16, height: 54,
    borderWidth: 1, borderColor: colors.border,
  },
  at: { color: colors.violet, fontSize: 18, fontWeight: '800', marginRight: 6 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, height: 54 },
  bigBtn: {
    height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', marginTop: 14,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7,
  },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  note: { flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginTop: 18, alignItems: 'flex-start' },
  noteText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
});
