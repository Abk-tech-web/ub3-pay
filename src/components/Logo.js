import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '../context/ThemeContext';

export default function Logo({ size = 24 }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.row}>
      <MaskedView
        maskElement={<Text style={[styles.ub3, { fontSize: size }]}>UB3</Text>}
      >
        <LinearGradient
          colors={[colors.chrome, colors.violet, colors.violetDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: size * 1.3, width: size * 2.3 }}
        />
      </MaskedView>
      <Text style={[styles.pay, { fontSize: size, marginLeft: size * 0.18 }]}>Pay</Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ub3: { fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  pay: { fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3 },
});
