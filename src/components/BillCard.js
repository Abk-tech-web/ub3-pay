import React, { useRef } from 'react';
import { Pressable, Animated, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';

export default function BillCard({ icon, label, onPress, accent }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  const tint = accent || colors.violetSoft;

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={['#e4e4e8', '#b8b8c2', '#9a9aa5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={[styles.chip, { backgroundColor: tint }]}>
            <Feather name={icon} size={16} color="#fff" />
          </View>
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing(2),
    borderRadius: radii.md,
    paddingVertical: spacing(3), paddingHorizontal: spacing(3),
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  chip: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#1a1a1f', fontWeight: '800', fontSize: 13 },
});
