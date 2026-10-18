import React, { useRef, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const META = {
  HomeTab: { icon: 'wallet-outline', lib: 'ionicons' },
  SwapTab: { icon: 'repeat' },
  NairaTab: { symbol: '\u20a6' },
  ActivityTab: { icon: 'clock' },
  ProfileTab: { icon: 'user' },
};

function TabItem({ meta, label, isFocused, onPress, colors, styles }) {
  const focus = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(focus, {
      toValue: isFocused ? 1 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const tint = isFocused ? colors.violet : colors.textSecondary;
  const capOpacity = focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] });
  const capScale = focus.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const iconScale = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const pressIn = () => Animated.spring(press, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();

  let icon = null;
  if (meta.symbol) {
    icon = <Text style={[styles.nairaSymbol, { color: tint }]}>{meta.symbol}</Text>;
  } else if (meta.lib === 'ionicons') {
    icon = <Ionicons name={meta.icon} size={24} color={tint} />;
  } else {
    icon = <Feather name={meta.icon} size={23} color={tint} />;
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.item}>
      <Animated.View style={[styles.inner, { transform: [{ scale: press }] }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.capsule, { backgroundColor: colors.violet, opacity: capOpacity, transform: [{ scale: capScale }] }]}
        />
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>{icon}</Animated.View>
        <Text style={[styles.label, { color: tint, fontWeight: isFocused ? '800' : '600' }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const meta = META[route.name] || {};

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TabItem
              key={route.key}
              meta={meta}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              colors={colors}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: { flex: 1 },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    marginHorizontal: 3,
    gap: 3,
  },
  capsule: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
  },
  label: { fontSize: 11 },
  nairaSymbol: { fontSize: 23, fontWeight: '800', lineHeight: 27 },
});
