import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../config/theme';

const SYMBOL_TO_CHAIN_SLUG = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'smartchain', SOL: 'solana', TRX: 'tron',
  MATIC: 'polygon', SUI: 'sui', TON: 'ton', AVAX: 'avalanchec', ADA: 'cardano',
  LTC: 'litecoin', XRP: 'ripple',
};
const SYMBOL_TO_ICON_SLUG = {
  BTC: 'btc', ETH: 'eth', BNB: 'bnb', SOL: 'sol', TRX: 'trx',
  MATIC: 'matic', SUI: 'sui', TON: 'ton', AVAX: 'avax', ADA: 'ada',
  LTC: 'ltc', XRP: 'xrp', USDT: 'usdt', USDC: 'usdc',
};

function iconUrl(symbol) {
  const chainSlug = SYMBOL_TO_CHAIN_SLUG[symbol];
  if (chainSlug) {
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainSlug}/info/logo.png`;
  }
  const slug = SYMBOL_TO_ICON_SLUG[symbol];
  if (!slug) return null;
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${slug}.png`;
}

export default function TokenIcon({ symbol, size = 40 }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [failed, setFailed] = useState(false);
  const url = iconUrl(symbol);

  if (!url || failed) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.fallbackLetter}>{symbol?.charAt(0)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setFailed(true)}
    />
  );
}

const getStyles = (colors) => StyleSheet.create({
  fallback: {
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackLetter: { color: colors.violetSoft, fontWeight: '700' },
});
