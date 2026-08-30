import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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

export default function SwapScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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
      <View style={styles.body}>
        <Text style={styles.title}>Swap</Text>

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

        <Pressable style={styles.swapIconWrap} onPress={() => { const s = sellSymbol; setSellSymbol(buySymbol === "NGN" ? "NGN" : buySymbol); setBuySymbol(s === "NGN" ? "NGN" : s); setAmount(""); setQuote(null); }}>
          <View style={styles.swapIconCircle}>
            <Feather name="repeat" size={18} color={colors.violet} />
          </View>
        </Pressable>

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
      </View>

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
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: spacing(5) },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing(4), borderWidth: 1, borderColor: colors.border },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing(3) },
  cardLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  balanceText: { color: colors.textSecondary, fontSize: 12 },
  cardMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assetChip: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), backgroundColor: colors.bgElevated, paddingVertical: spacing(1.5), paddingHorizontal: spacing(2.5), borderRadius: radii.pill },
  assetChipText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  amountInput: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: spacing(3) },
  receiveAmount: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  swapIconWrap: { alignItems: 'center', marginVertical: -spacing(2.5), zIndex: 2 },
  swapIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 4, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  flagCircleSmall: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  comingSoon: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), backgroundColor: '#2e2a0f', borderRadius: radii.md, paddingVertical: spacing(2), paddingHorizontal: spacing(3), marginTop: spacing(5) },
  comingSoonText: { color: '#facc15', fontSize: 12, fontWeight: '600', flex: 1 },
  quoteBox: { marginTop: spacing(6), backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing(4), borderWidth: 1, borderColor: colors.border },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quoteLabel: { color: colors.textSecondary, fontSize: 13 },
  quoteValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
