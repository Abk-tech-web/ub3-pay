import React, { useRef } from 'react';
import { Pressable, Animated, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../config/theme';

export default function ActionButton({ icon, label, onPress, gradient }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  const colorsPair = gradient || [colors.violet, colors.violetDeep];

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={colorsPair}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.square, { shadowColor: colorsPair[0] }]}
        >
          <Feather name={icon} size={20} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '18%' },
  square: {
    width: 52, height: 52, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing(2),
    shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  label: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
});
