import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export default function AnimatedCard({ index = 0, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 8) * 60 + 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
