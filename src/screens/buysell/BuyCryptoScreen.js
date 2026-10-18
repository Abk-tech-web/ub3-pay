import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/theme';

const VIOLET = '#7C3AED';
const SHADOW = '#2a1260';

function Reveal({ index, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function BuyCryptoScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Reveal index={0} style={styles.headerRow}>
          <View style={styles.badge}>
            <Feather name="shopping-bag" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing(4) }}>
            <Text style={styles.title}>Buy crypto</Text>
            <Text style={styles.headerSub}>Pay with Naira, get crypto</Text>
          </View>
        </Reveal>

        <Reveal index={1} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Fund your Naira account</Text>
              <Text style={styles.stepText}>Add Naira by bank transfer to your UB3 account.</Text>
            </View>
          </View>
          <View style={styles.connector} />
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Swap Naira to crypto</Text>
              <Text style={styles.stepText}>This reuses the Naira {'\u2192'} Crypto swap flow.</Text>
            </View>
          </View>
        </Reveal>

        <View style={{ flex: 1 }} />

        <Reveal index={2}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed ? styles.pressed : null]}
            onPress={() => navigation.navigate('NairaTab', { screen: 'NairaAccount' })}
          >
            <Feather name="credit-card" size={19} color="#fff" />
            <Text style={styles.primaryText}>Fund Naira account</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}
            onPress={() => navigation.navigate('SwapTab', { screen: 'Swap', params: { symbol: 'NGN' } })}
          >
            <Feather name="repeat" size={19} color={VIOLET} />
            <Text style={styles.secondaryText}>Go to swap</Text>
          </Pressable>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(8), paddingBottom: spacing(28) },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(6) },
  badge: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: SHADOW, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  stepNum: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: VIOLET, fontWeight: '800', fontSize: 16 },
  stepTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  stepText: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  connector: { width: 2, height: 18, backgroundColor: 'rgba(124,58,237,0.25)', marginLeft: 19, marginVertical: 4 },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: VIOLET, borderRadius: 999, paddingVertical: spacing(4.5),
    shadowColor: VIOLET, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 10,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: spacing(3),
    backgroundColor: colors.bgCard, borderRadius: 999, paddingVertical: spacing(4.5), borderWidth: 2, borderColor: VIOLET,
  },
  secondaryText: { color: VIOLET, fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
