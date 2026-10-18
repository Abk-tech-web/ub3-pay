import React, { useRef, useEffect } from 'react';
import { Pressable, Animated, Text, View, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

export default function ActionButton({ icon, label, onPress, style, index = 0 }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const press = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 450,
      delay: 120 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start();
    Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
    Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const rotateX = press.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '22deg'] });
  const translateY = appear.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.wrap, style]}>
      <Animated.View style={{ alignItems: 'center', opacity: appear, transform: [{ translateY }, { perspective: 500 }, { rotateX }, { scale }] }}>
        <View style={[styles.shadowWrap, { shadowColor: colors.violetDeep, backgroundColor: colors.violetDeep }]}>
          <LinearGradient
            colors={['#9B6CF7', colors.violet, colors.violetDeep]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.square}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.gloss}
              pointerEvents="none"
            />
            <View style={styles.iconBox}>
              <Feather name={icon} size={24} color="rgba(20,0,60,0.45)" style={styles.iconShadow} />
              <Feather name={icon} size={24} color="#fff" />
            </View>
          </LinearGradient>
        </View>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '25%' },
  shadowWrap: {
    width: 60,
    height: 60,
    borderRadius: 22,
    marginBottom: spacing(2),
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },
  square: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  iconBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  iconShadow: { position: 'absolute', top: 1.5, left: 0 },
  label: { fontSize: 12, fontWeight: '700' },
});
