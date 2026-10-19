import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';

const VIOLET = '#7C3AED';

// Drop-in replacement for ActivityIndicator: the UB3 logo inside a spinning ring.
// size: 'small' (30) | 'large' (56) | a number.  color: ring color.
export default function UB3Loader({ size = 'small', color, style }) {
  const S = size === 'large' ? 56 : typeof size === 'number' ? size : 30;
  const ringColor = color || VIOLET;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bw = Math.max(2, Math.round(S * 0.07));
  const logo = Math.round(S * 0.62);

  return (
    <View style={[{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={{
          position: 'absolute', width: S, height: S, borderRadius: S / 2, borderWidth: bw,
          borderColor: 'transparent', borderTopColor: ringColor, borderRightColor: ringColor,
          transform: [{ rotate }],
        }}
      />
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: logo, height: logo, borderRadius: Math.round(logo * 0.28) }}
        resizeMode="cover"
      />
    </View>
  );
}
