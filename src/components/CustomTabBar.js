import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const META = {
  HomeTab: { icon: 'wallet-outline', lib: 'ionicons', color: '#60a5fa' },
  SwapTab: { icon: 'repeat', color: '#a78bfa' },
  NairaTab: { symbol: '\u20a6', color: '#34d399', alwaysTinted: true },
  ActivityTab: { icon: 'clock', color: '#fb923c' },
  ProfileTab: { icon: 'user', color: '#f472b6' },
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        const meta = META[route.name];
        const tint = (isFocused || meta.alwaysTinted) ? meta.color : colors.textSecondary;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            {meta.symbol ? (
              <Text style={[styles.nairaSymbol, { color: tint }]}>{meta.symbol}</Text>
            ) : meta.lib === 'ionicons' ? (
              <Ionicons name={meta.icon} size={26} color={tint} />
            ) : (
              <Feather name={meta.icon} size={26} color={tint} />
            )}
            <Text style={[styles.label, { color: isFocused ? meta.color : colors.textSecondary, fontWeight: isFocused ? '700' : '500' }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(2.5),
    paddingBottom: spacing(6),
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 11 },
  nairaSymbol: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
});
