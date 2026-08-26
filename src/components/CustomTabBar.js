import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';

const META = {
  HomeTab: { icon: 'credit-card', color: '#60a5fa' },
  SwapTab: { icon: 'repeat', color: '#a78bfa' },
  NairaTab: { symbol: '₦', color: '#34d399' },
  ActivityTab: { icon: 'clock', color: '#fb923c' },
  ProfileTab: { icon: 'user', color: '#f472b6' },
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const meta = META[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const IconEl = meta.symbol ? (
            <Text style={[styles.nairaSymbol, { color: isFocused ? '#fff' : meta.color }]}>{meta.symbol}</Text>
          ) : (
            <Feather name={meta.icon} size={isFocused ? 16 : 18} color={isFocused ? '#fff' : meta.color} />
          );

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              {isFocused ? (
                <View style={[styles.activePill, { backgroundColor: meta.color }]}>
                  {IconEl}
                  <Text style={styles.activeLabel}>{label}</Text>
                </View>
              ) : (
                <View style={[styles.inactiveChip, { backgroundColor: meta.color + '1f' }]}>
                  {IconEl}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: 24 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(2),
    backgroundColor: '#1c1c22', borderRadius: 30,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  item: {},
  inactiveChip: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(1),
    borderRadius: 22, paddingVertical: 10, paddingHorizontal: 14,
  },
  activeLabel: { color: '#fff', fontWeight: '700', fontSize: 12 },
  nairaSymbol: { fontSize: 16, fontWeight: '800' },
});
