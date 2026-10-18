import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../config/theme';
import TokenIcon from './TokenIcon';
import NetworkPills from './NetworkPills';

export default function AssetSelectCard({ symbol, chainIds, iconChainId, subtitle, right, rightSub, index = 0, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 8) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const hasPills = chainIds && chainIds.length > 0;
  return (
    <Animated.View style={[styles.card, { opacity: anim, transform: [{ translateY: translateY }] }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        android_ripple={{ color: 'rgba(124,58,237,0.12)' }}
      >
        <View style={styles.iconRing}>
          <TokenIcon symbol={symbol} chainId={iconChainId} size={36} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing(3) }}>
          <Text style={styles.symbol}>{symbol}</Text>
          {hasPills ? <NetworkPills chainIds={chainIds} /> : (subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null)}
        </View>
        {right != null ? (
          <View style={{ alignItems: 'flex-end', marginRight: spacing(2) }}>
            <Text style={styles.right}>{right}</Text>
            {rightSub != null ? <Text style={styles.rightSub}>{rightSub}</Text> : null}
          </View>
        ) : null}
        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, marginVertical: spacing(1.5),
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: '#2a1260', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3.5), borderRadius: 22 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  iconRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.35)', alignItems: 'center', justifyContent: 'center' },
  symbol: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  right: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  rightSub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
});
