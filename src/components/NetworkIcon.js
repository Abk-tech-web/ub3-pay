import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, radii } from '../config/theme';

export default function NetworkIcon({ network, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (!network?.logoUrl || failed) {
    return (
      <View style={[styles.fallback, dim]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
          {(network?.name || '?').charAt(0)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, dim]}>
      <Image
        source={{ uri: network.logoUrl }}
        style={dim}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  fallback: { backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.bg, fontWeight: '800' },
});
