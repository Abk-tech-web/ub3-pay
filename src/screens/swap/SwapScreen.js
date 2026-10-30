import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable, TextInput, Animated, Easing } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ActivityIndicator from '../../components/UB3Loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import * as swapService from '../../services/swapService';
import { formatNgn, formatCrypto } from '../../utils/formatters';
import { isPositiveAmount } from '../../utils/validators';
import TokenIcon from '../../components/TokenIcon';
import AssetPickerModal from '../../components/AssetPickerModal';

const SHADOW = '#2a1260';

function quoteMessage(e) {
  const c = (e && (e.code || e.message)) || '';
  if (c === 'insufficient_balance') return 'Not enough balance. Keep a little extra for network fees.';
  if (c === 'no_liquidity') return 'Not enough liquidity right now. Try a smaller amount or try again later.';
  if (c === 'insufficient_gas') return 'You need a little SOL (Solana) or ETH (Base) in your wallet to pay the network fee for this swap.';
  if (c === 'below_minimum') return 'The minimum swap is about $1.';
  if (c === 'above_maximum') return 'The maximum swap is $2,000.';
  if (c === 'price_unavailable' || c === 'balance_unavailable') return 'Could not get a live price. Please try again.';
  if (c === 'unsupported_pair') return 'This pair is not available yet.';
  return 'Could not get a quote. Please try again.';
}

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

function AssetBadge({ symbol, styles }) {
  if (symbol === 'NGN') {
    return (
      <View style={styles.flagCircleSmall}>
        <Text style={{ fontSize: 15, color: '#008751', fontWeight: '800' }}>{'\u20A6'}</Text>
      </View>
    );
  }
  return <TokenIcon symbol={symbol} size={28} />;
}

export default function SwapScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { portfolio } = useWallet();
  const ngnRate = portfolio.totalUsd > 0 ? portfolio.totalNgn / portfolio.totalUsd : 1600;
  const assets = [{ symbol: 'NGN', balance: portfolio.ngnBalance ?? 0, usdValue: (portfolio.ngnBalance ?? 0) / ngnRate }, ...(portfolio.assets || [])];
  const [sellSymbol, setSellSymbol] = useState((route && route.params && route.params.symbol) || 'USDT');
  const [buySymbol, setBuySymbol] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');
  const [pickerFor, setPickerFor] = useState(null); // 'sell' | 'buy' | null

  useFocusEffect(useCallback(() => {
    setAmount('');
    setQuote(null);
  }, []));

  const isCryptoToCrypto = sellSymbol !== 'NGN' && buySymbol !== 'NGN';
  const isNgnToCrypto = sellSymbol === 'NGN' && buySymbol !== 'NGN';
  const C2C = ['SOL', 'BNB', 'ETH', 'USDC', 'USDT'];
  const [sellNet, setSellNet] = useState('');
  const [buyNet, setBuyNet] = useState('');
  const NETS = { USDC: ['solana', 'base'], USDT: ['bsc', 'base'], ETH: ['base', 'arbitrum', 'optimism'] };
  const NET_LABEL = { solana: 'Solana', base: 'Base', arbitrum: 'Arbitrum', optimism: 'Optimism', bsc: 'BNB Chain' };
  const sellNets = NETS[sellSymbol] || null;
  const buyNets = NETS[buySymbol] || null;
  const sellChain = sellNets ? (sellNets.indexOf(sellNet) >= 0 ? sellNet : sellNets[0]) : '';
  const buyChain = buyNets ? (buyNets.indexOf(buyNet) >= 0 ? buyNet : buyNets[0]) : '';
  const netPill = (on) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.violet, marginRight: 8, backgroundColor: on ? colors.violet : 'transparent' });
  const c2cOk = isCryptoToCrypto && C2C.indexOf(sellSymbol) >= 0 && C2C.indexOf(buySymbol) >= 0 && sellSymbol !== buySymbol;

  useEffect(() => {
    setQuoteErr('');
    if (!isPositiveAmount(amount) || (isCryptoToCrypto && !c2cOk)) return setQuote(null);
    setQuoting(true);
    const t = setTimeout(() => {
      (c2cOk ? swapService.quoteCryptoToCrypto(sellSymbol, buySymbol, parseFloat(amount), sellChain, buyChain) : sellSymbol === 'NGN' ? swapService.quoteNgnToCrypto(buySymbol, parseFloat(amount)) : swapService.quoteCryptoToNgn(sellSymbol, parseFloat(amount))).then(setQuote).catch((e) => { setQuote(null); setQuoteErr(quoteMessage(e)); }).finally(() => setQuoting(false));
    }, 350);
    return () => clearTimeout(t);
  }, [amount, sellSymbol, buySymbol, sellChain, buyChain]);

  const SWAP_CHAIN = { SOL: 'solana', BNB: 'bsc', ETH: 'base', USDC: 'solana', USDT: 'solana' };
  const sellAsset = c2cOk
    ? assets.find((a) => a.symbol === sellSymbol && a.chainId === (sellChain || SWAP_CHAIN[sellSymbol]))
    : assets.find((a) => a.symbol === sellSymbol);
  const sellBal = sellAsset ? parseFloat(sellAsset.balance) || 0 : 0;
  const setPct = (p) => {
    if (!sellAsset) return;
    const dec = sellSymbol === 'NGN' ? 2 : 6;
    setAmount(String(parseFloat((sellBal * p).toFixed(dec))));
  };
  const overBalance = isPositiveAmount(amount) && parseFloat(amount) > sellBal + 1e-9;

  const receiveText = isCryptoToCrypto ? (c2cOk && quote ? formatCrypto(quote.toAmount, buySymbol) : '-') : quote ? (isNgnToCrypto ? formatCrypto(quote.amountCrypto, buySymbol) : formatNgn(quote.amountNgn)) : '0.00';
  const rateText = quote && c2cOk ? ('1 ' + sellSymbol + ' \u2248 ' + formatCrypto(quote.rate, buySymbol) + ' ' + buySymbol + ' \u00B7 1% fee included') : quote && !isCryptoToCrypto
    ? '1 ' + (isNgnToCrypto ? buySymbol : sellSymbol) + ' \u2248 ' + formatNgn(quote.rate) + ' \u00B7 1% fee included'
    : 'Live P2P rate \u00B7 1% fee included';
  const canContinue = !!quote && (!isCryptoToCrypto || c2cOk);

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.heroTop}>
            <View style={styles.headerBadge}>
              <Feather name="repeat" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Swap</Text>
              <Text style={styles.subtitle}>Convert your crypto to Naira instantly</Text>
            </View>
          </View>
          <View style={styles.ratePill}>
            <Feather name="zap" size={12} color="#fff" />
            <Text style={styles.rateText} numberOfLines={1}>{rateText}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Reveal index={0} style={[styles.card, { marginTop: -34 }]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardLabel}>You pay</Text>
              <Text style={styles.balanceText}>Available: {sellAsset ? formatCrypto(sellAsset.balance, '') : '0'}</Text>
            </View>
            <View style={styles.cardMainRow}>
              <Pressable style={styles.assetChip} onPress={() => setPickerFor('sell')}>
                <AssetBadge symbol={sellSymbol} styles={styles} />
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
            <View style={styles.chipsRow}>
              <Pressable style={styles.pctChip} onPress={() => setPct(0.25)}><Text style={styles.pctText}>25%</Text></Pressable>
              <Pressable style={styles.pctChip} onPress={() => setPct(0.5)}><Text style={styles.pctText}>50%</Text></Pressable>
              <Pressable style={[styles.pctChip, styles.maxChip]} onPress={() => setPct(1)}><Text style={[styles.pctText, { color: '#fff' }]}>MAX</Text></Pressable>
            </View>
            {isCryptoToCrypto && sellNets ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: colors.textSecondary, marginRight: 10, fontSize: 12 }}>Pay from</Text>
                {sellNets.map((n) => (
                  <Pressable key={n} onPress={() => setSellNet(n)} style={netPill(sellChain === n)}>
                    <Text style={{ fontSize: 12, color: sellChain === n ? '#fff' : colors.violet }}>{NET_LABEL[n]}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {overBalance ? <Text style={styles.overText}>Insufficient balance</Text> : null}
          </Reveal>

          <SwapToggle
            colors={colors}
            styles={styles}
            onPress={() => { const s = sellSymbol; setSellSymbol(buySymbol); setBuySymbol(s); setAmount(''); setQuote(null); }}
          />

          <Reveal index={1} style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardLabel}>You get</Text>
              {quote && !isCryptoToCrypto ? <Text style={styles.balanceText}>after 1% fee</Text> : null}
            </View>
            <View style={styles.cardMainRow}>
              <Pressable style={styles.assetChip} onPress={() => setPickerFor('buy')}>
                <AssetBadge symbol={buySymbol} styles={styles} />
                <Text style={styles.assetChipText}>{buySymbol}</Text>
                <Feather name="chevron-down" size={16} color={colors.textSecondary} />
              </Pressable>
              <Text style={styles.receiveAmount} numberOfLines={1} adjustsFontSizeToFit>{receiveText}</Text>
            </View>
          </Reveal>

          {isCryptoToCrypto && buyNets ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
              <Text style={{ color: colors.textSecondary, marginRight: 10, fontSize: 12 }}>Receive on</Text>
              {buyNets.map((n) => (
                <Pressable key={n} onPress={() => setBuyNet(n)} style={netPill(buyChain === n)}>
                  <Text style={{ fontSize: 12, color: buyChain === n ? '#fff' : colors.violet }}>{NET_LABEL[n]}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {isCryptoToCrypto && !c2cOk ? (
            <View style={styles.comingSoon}>
              <Feather name="alert-circle" size={16} color="#f59e0b" />
              <Text style={styles.comingSoonText}>Only SOL, BNB, ETH (Base, Arbitrum or Optimism), USDC (Solana or Base) and USDT (BNB Chain or Base) can be swapped with each other for now. More coins are coming soon.</Text>
            </View>
          ) : null}

          {quote && c2cOk ? (
            <View style={styles.summary}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Rate</Text>
                <Text style={styles.sumValue}>1 {sellSymbol} {'\u2248'} {formatCrypto(quote.rate, buySymbol)} {buySymbol}</Text>
              </View>
              <View style={styles.sumDivider} />
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Fee</Text>
                <Text style={styles.sumValue}>{quote.feePct}% (included)</Text>
              </View>
              <View style={styles.sumDivider} />
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>You get</Text>
                <Text style={[styles.sumValue, { color: colors.violet }]}>{receiveText} {buySymbol}</Text>
              </View>
            </View>
          ) : null}
          {c2cOk && (sellSymbol === 'ETH' || buySymbol === 'ETH') ? (
            <Text style={styles.baseNote}>ETH swaps use the network you select. Your ETH on that network is used, and ETH you receive arrives on it.</Text>
          ) : null}
          {quoteErr ? (
            <View style={styles.comingSoon}>
              <Feather name="alert-circle" size={16} color="#f59e0b" />
              <Text style={styles.comingSoonText}>{quoteErr}</Text>
            </View>
          ) : null}
          {quoting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size={36} color={colors.violet} />
              <Text style={styles.loadingText}>Getting the best rate...</Text>
            </View>
          ) : null}

          {quote && !isCryptoToCrypto ? (
            <View style={styles.summary}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Rate</Text>
                <Text style={styles.sumValue}>1 {isNgnToCrypto ? buySymbol : sellSymbol} {'\u2248'} {formatNgn(quote.rate)}</Text>
              </View>
              <View style={styles.sumDivider} />
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Fee</Text>
                <Text style={styles.sumValue}>1% (included)</Text>
              </View>
              <View style={styles.sumDivider} />
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>You get</Text>
                <Text style={[styles.sumValue, { color: colors.violet }]}>{receiveText}</Text>
              </View>
            </View>
          ) : null}

          <Pressable
            disabled={!canContinue}
            onPress={() => navigation.navigate('SwapConfirmation', { direction: c2cOk ? 'crypto_to_crypto' : isNgnToCrypto ? 'ngn_to_crypto' : 'crypto_to_ngn', symbol: c2cOk ? sellSymbol : isNgnToCrypto ? buySymbol : sellSymbol, amount, quote })}
            style={({ pressed }) => [styles.bigBtn, !canContinue && { opacity: 0.45 }, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.bigBtnText}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

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
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBadge: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#A78BFA', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  ratePill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, maxWidth: '100%',
  },
  rateText: { color: '#fff', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  body: { paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 26, padding: 18, marginTop: 0,
    shadowColor: SHADOW, shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  balanceText: { color: colors.textSecondary, fontSize: 12 },
  cardMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
  },
  assetChipText: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  amountInput: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: 12, padding: 0, height: 52 },
  receiveAmount: { color: colors.violet, fontSize: 30, fontWeight: '800', flex: 1, textAlign: 'right', marginLeft: 12 },
  chipsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pctChip: { flex: 1, height: 38, borderRadius: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  maxChip: {
    backgroundColor: colors.violet, borderColor: colors.violet,
    shadowColor: colors.violet, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  pctText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  overText: { color: colors.danger, fontSize: 12, fontWeight: '700', marginTop: 10 },
  swapIconWrap: { alignItems: 'center', marginVertical: -22, zIndex: 2 },
  swapShadow: { borderRadius: 26, shadowColor: colors.violetDeep, backgroundColor: colors.violetDeep, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  swapIconCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  flagCircleSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,135,81,0.15)' },
  comingSoon: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(245,158,11,0.14)', borderRadius: 18, padding: 14, marginTop: 18,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  comingSoonText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 },
  loadingText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  baseNote: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  summary: {
    marginTop: 18, backgroundColor: colors.bgCard, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 6,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, gap: 12 },
  sumDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  sumLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  sumValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  bigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 58, borderRadius: 20, backgroundColor: colors.violet, marginTop: 20,
    shadowColor: colors.violet, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 9,
  },
  bigBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
