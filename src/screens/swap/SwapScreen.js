import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable, TextInput, Animated } from 'react-native';
import ActivityIndicator from '../../components/UB3Loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import * as swapService from '../../services/swapService';
import { formatNgn, formatCrypto } from '../../utils/formatters';
import { isPositiveAmount } from '../../utils/validators';
import TokenIcon from '../../components/TokenIcon';
import PrimaryButton from '../../components/PrimaryButton';
import AssetPickerModal from '../../components/AssetPickerModal';

function SwapToggle({ onPress, colors, styles }) {
  const spin = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const turns = useRef(0);
  const go = () => {
    turns.current += 1;
    Animated.spring(spin, { toValue: turns.current, friction: 6, tension: 60, useNativeDriver: true }).start();
    onPress();
  };
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '270deg'] });
  return (
    <View style={styles.swapIconWrap}>
      <Pressable
        onPress={go}
        onPressIn={() => Animated.spring(press, { toValue: 0.86, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <Animated.View style={[styles.swapShadow, { transform: [{ scale: press }] }]}>
          <LinearGradient
            colors={['#9B6CF7', colors.violet, colors.violetDeep]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.swapIconCircle}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Feather name="repeat" size={20} color="#fff" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function SwapScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }).start();
  }, []);
  const { user } = useAuth();
  const { portfolio } = useWallet();
  const ngnRate = portfolio.totalUsd > 0 ? portfolio.totalNgn / portfolio.totalUsd : 1600;
  const assets = [{ symbol: 'NGN', balance: portfolio.ngnBalance ?? 0, usdValue: (portfolio.ngnBalance ?? 0) / ngnRate }, ...(portfolio.assets || [])];
  const [sellSymbol, setSellSymbol] = useState(route?.params?.symbol || 'USDT');
  const [buySymbol, setBuySymbol] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [pickerFor, setPickerFor] = useState(null); // 'sell' | 'buy' | null

  useFocusEffect(useCallback(() => {
    setAmount('');
    setQuote(null);
  }, []));


  const isCryptoToCrypto = sellSymbol !== 'NGN' && buySymbol !== 'NGN'; const isNgnToCrypto = sellSymbol === 'NGN' && buySymbol !== 'NGN';

  useEffect(() => {
    if (!isPositiveAmount(amount) || isCryptoToCrypto) return setQuote(null);
    setQuoting(true);
    const t = setTimeout(() => {
      (sellSymbol === 'NGN' ? swapService.quoteNgnToCrypto(buySymbol, parseFloat(amount)) : swapService.quoteCryptoToNgn(sellSymbol, parseFloat(amount))).then(setQuote).finally(() => setQuoting(false));
    }, 350);
    return () => clearTimeout(t);
  }, [amount, sellSymbol, buySymbol]);

  const sellAsset = assets.find((a) => a.symbol === sellSymbol);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.body, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }]}>
        <View style={styles.headerRow}>
          <LinearGradient colors={['#9B6CF7', colors.violet, colors.violetDeep]} style={styles.headerBadge}>
            <Feather name="repeat" size={18} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.title}>Swap</Text>
            <Text style={styles.subtitle}>Convert your crypto to Naira instantly</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardLabel}>Sell</Text>
            <Pressable onPress={() => sellAsset && setAmount(String(parseFloat(parseFloat(sellAsset.balance).toFixed(sellSymbol === 'NGN' ? 2 : 6))))}><Text style={styles.balanceText}>{sellAsset ? formatCrypto(sellAsset.balance, '') : '0'} <Text style={{ color: colors.violet, fontWeight: '700' }}>MAX</Text></Text></Pressable>
          </View>
          <View style={styles.cardMainRow}>
            <Pressable style={styles.assetChip} onPress={() => setPickerFor('sell')}>
              {sellSymbol === 'NGN' ? (<View style={styles.flagCircleSmall}><Text style={{ fontSize: 15, color: '#008751', fontWeight: '800' }}>₦</Text></View>) : (<TokenIcon symbol={sellSymbol} size={26} />)}
              <Text style={styles.assetChipText}>{sellSymbol}</Text>
              <Feather name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <SwapToggle colors={colors} styles={styles} onPress={() => { const s = sellSymbol; setSellSymbol(buySymbol === "NGN" ? "NGN" : buySymbol); setBuySymbol(s === "NGN" ? "NGN" : s); setAmount(""); setQuote(null); }} />

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardLabel}>Buy</Text>
          </View>
          <View style={styles.cardMainRow}>
            <Pressable style={styles.assetChip} onPress={() => setPickerFor('buy')}>
              {buySymbol === 'NGN' ? (
              <View style={styles.flagCircleSmall}><Text style={{ fontSize: 15, color: '#008751', fontWeight: '800' }}>₦</Text></View>
              ) : (
                <TokenIcon symbol={buySymbol} size={26} />
              )}
              <Text style={styles.assetChipText}>{buySymbol}</Text>
              <Feather name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.receiveAmount}>
              {isCryptoToCrypto ? '-' : quote ? (isNgnToCrypto ? formatCrypto(quote.amountCrypto, buySymbol) : formatNgn(quote.amountNgn)) : '0.00'}
            </Text>
          </View>
        </View>

        {isCryptoToCrypto && (
          <View style={styles.comingSoon}>
            <Feather name="alert-circle" size={14} color="#facc15" />
            <Text style={styles.comingSoonText}>Crypto-to-crypto swaps are coming soon. Try swapping to NGN for now.</Text>
          </View>
        )}

        {quoting && <ActivityIndicator color={colors.violet} style={{ marginTop: spacing(4) }} />}

        {quote && !isCryptoToCrypto && (
          <View style={styles.quoteBox}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate</Text>
              <Text style={styles.quoteValue}>1 {isNgnToCrypto ? buySymbol : sellSymbol} ≈ {formatNgn(quote.rate)}</Text>
            </View>
          </View>
        )}

        <View style={{ flex: 1 }} />
        <PrimaryButton
          title="Continue"
          disabled={!quote || isCryptoToCrypto}
          onPress={() => navigation.navigate('SwapConfirmation', { direction: isNgnToCrypto ? 'ngn_to_crypto' : 'crypto_to_ngn', symbol: isNgnToCrypto ? buySymbol : sellSymbol, amount, quote })}
        />
      </Animated.View>

      <AssetPickerModal
        visible={pickerFor === 'sell'}
        onClose={() => setPickerFor(null)}
        onSelect={(symbol) => setSellSymbol(symbol)}
        assets={assets}
        pinnedSymbol="USDT"
      />
      <AssetPickerModal
        visible={pickerFor === 'buy'}
        onClose={() => setPickerFor(null)}
        onSelect={(symbol) => setBuySymbol(symbol)}
        assets={assets}
        includeNgn
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6) },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing(6) },
  headerBadge: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#2a1260', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  card: { backgroundColor: colors.bgCard, borderRadius: 26, padding: spacing(5), borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.24, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 11 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(3) },
  cardLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  balanceText: { color: colors.textSecondary, fontSize: 12 },
  cardMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assetChip: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), backgroundColor: colors.bgElevated, paddingVertical: spacing(1.5), paddingHorizontal: spacing(2.5), borderRadius: 999, borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  assetChipText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  amountInput: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: spacing(3) },
  receiveAmount: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  swapIconWrap: { alignItems: 'center', marginVertical: -spacing(3.5), zIndex: 2 },
  swapShadow: { borderRadius: 24, shadowColor: colors.violetDeep, backgroundColor: colors.violetDeep, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  swapIconCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  flagCircleSmall: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,135,81,0.15)' },
  comingSoon: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), backgroundColor: '#2e2a0f', borderRadius: 18, paddingVertical: spacing(3), paddingHorizontal: spacing(4), marginTop: spacing(6), shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  comingSoonText: { color: '#facc15', fontSize: 12, fontWeight: '600', flex: 1 },
  quoteBox: { marginTop: spacing(6), backgroundColor: colors.bgCard, borderRadius: 22, padding: spacing(4), borderWidth: 1, borderColor: colors.border, shadowColor: '#2a1260', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quoteLabel: { color: colors.textSecondary, fontSize: 13 },
  quoteValue: { color: colors.violet, fontSize: 14, fontWeight: '800' },
});
