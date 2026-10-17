import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { apiGet } from '../../services/api';

function pretty(id) {
  if (!id) return '...';
  if (/^[0-9]{8}$/.test(id)) return id.slice(0, 4) + ' ' + id.slice(4);
  return '@' + id;
}

export default function Ub3IdRow({ navigation }) {
  const { colors } = useTheme();
  const [id, setId] = useState('');
  const [copied, setCopied] = useState(false);

  useFocusEffect(useCallback(() => {
    let alive = true;
    apiGet('/ub3id/me')
      .then((r) => { if (alive && r && r.ub3Id) setId(r.ub3Id); })
      .catch(() => {});
    return () => { alive = false; };
  }, []));

  const copy = async () => {
    if (!id) return;
    await Clipboard.setStringAsync(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={s.wrap}>
      <Text style={[s.label, { color: colors.textSecondary }]}>UB3 ID</Text>
      <View style={s.pill}>
        <Pressable onPress={copy} hitSlop={8} style={s.main}>
          <Text style={[s.value, { color: colors.textPrimary }]} numberOfLines={1}>{pretty(id)}</Text>
          <Feather name={copied ? 'check' : 'copy'} size={16} color={copied ? '#34d399' : colors.textSecondary} />
        </Pressable>
        <View style={s.divider} />
        <Pressable onPress={() => navigation.navigate('Ub3Id')} hitSlop={8}>
          <Feather name="edit-2" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 14 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5, marginBottom: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(127,127,127,0.35)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: 2.5 },
  divider: { width: 1, height: 18, backgroundColor: 'rgba(127,127,127,0.35)', marginHorizontal: 14 },
});
