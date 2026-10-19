import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { biometricAvailable, biometricLabel, authenticate, getBioPref, setBioPref } from '../../services/biometric';

const SHADOW = '#2a1260';

export default function SecuritySettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const uid = user && user.uid;

  const [avail, setAvail] = useState(false);
  const [label, setLabel] = useState('Biometrics');
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const a = await biometricAvailable();
      const pref = uid ? await getBioPref(uid) : null;
      const l = a ? await biometricLabel() : 'Biometrics';
      if (!alive) return;
      setAvail(a);
      setLabel(l);
      setOn(a && pref === '1');
      setReady(true);
    })();
    return () => { alive = false; };
  }, [uid]);

  const onToggle = async (v) => {
    if (!uid) return;
    if (v) {
      const ok = await authenticate('Confirm to enable ' + label);
      if (!ok) return;
      await setBioPref(uid, '1');
      setOn(true);
    } else {
      await setBioPref(uid, '0');
      setOn(false);
    }
  };

  const bioIcon = label.indexOf('Face') === 0 ? 'smile' : 'unlock';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconTile, { backgroundColor: 'rgba(124,58,237,0.14)' }]}>
              <Feather name={bioIcon} size={20} color={colors.violet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{label} unlock</Text>
              <Text style={styles.rowSub}>
                {!ready ? 'Checking this phone...' : avail ? 'Open UB3 Pay without typing your PIN.' : 'Not available. Set up a fingerprint or face unlock in your phone settings first.'}
              </Text>
            </View>
            <Switch
              value={on}
              onValueChange={onToggle}
              disabled={!ready || !avail}
              trackColor={{ true: colors.violet, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.card, styles.row, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('PinSetup')}
        >
          <View style={[styles.iconTile, { backgroundColor: 'rgba(167,139,250,0.18)' }]}>
            <Feather name="key" size={20} color={colors.violet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Change transaction PIN</Text>
            <Text style={styles.rowSub}>Your PIN also unlocks the app.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.note}>
          <Feather name="shield" size={16} color={colors.violet} />
          <Text style={styles.noteText}>
            The app locks when you open it, and again after you leave it for about 30 seconds. Your PIN always works as a backup.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 22, padding: 16, marginBottom: 16,
    shadowColor: SHADOW, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 },
  note: { flexDirection: 'row', gap: 10, paddingHorizontal: 6, marginTop: 4, alignItems: 'flex-start' },
  noteText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
});
