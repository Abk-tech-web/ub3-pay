import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../config/theme';
import PrimaryButton from './PrimaryButton';

export default function ConfirmationSheet({
  visible,
  title,
  icon = 'arrow-up-outline',
  rows = [],
  onConfirm,
  onCancel,
  loading,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const slide = useRef(new Animated.Value(80)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;
    slide.setValue(80);
    fade.setValue(0);
    pop.setValue(0.6);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const hero = rows.find((r) => r.label === 'Amount');
  const toRow = rows.find((r) => r.label === 'To');
  const rest = rows.filter((r) => r !== hero && r !== toRow);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
          <View style={styles.handle} />

          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
              <Ionicons name={icon} size={24} color="#fff" />
            </Animated.View>
            <Text style={styles.heroLabel}>{title}</Text>
            {hero ? (
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                {hero.value}
              </Text>
            ) : null}
            {toRow ? (
              <View style={styles.toPill}>
                <Text style={styles.toText} numberOfLines={1}>
                  {'To  ' + toRow.value}
                </Text>
              </View>
            ) : null}
          </View>

          {rest.length > 0 ? (
            <View style={styles.card}>
              {rest.map((r, i) => {
                const isTotal = String(r.label).indexOf('Total') === 0;
                const isFree = r.value === 'Free';
                return (
                  <View key={r.label}>
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, isTotal && styles.rowLabelStrong]}>
                        {r.label}
                      </Text>
                      <Text
                        style={[
                          styles.rowValue,
                          isTotal && { color: colors.violet },
                          isFree && { color: '#16a34a' },
                        ]}
                      >
                        {r.value}
                      </Text>
                    </View>
                    {i < rest.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={{ height: spacing(5) }} />
          <PrimaryButton title="Confirm" onPress={onConfirm} loading={loading} />
          <View style={{ height: spacing(3) }} />
          <PrimaryButton title="Cancel" onPress={onCancel} variant="ghost" disabled={loading} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(10,4,30,0.7)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: spacing(6),
      paddingBottom: spacing(9),
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing(5),
    },
    hero: {
      backgroundColor: '#4C1D95',
      borderRadius: 26,
      padding: spacing(6),
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: spacing(4),
      shadowColor: '#2a1260',
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    heroGlow: {
      position: 'absolute',
      top: -50,
      right: -40,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255,255,255,0.09)',
    },
    badge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#7C3AED',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    heroLabel: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    heroAmount: {
      color: '#fff',
      fontSize: 32,
      fontWeight: '800',
      marginTop: 6,
      maxWidth: '100%',
    },
    toPill: {
      marginTop: 12,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      maxWidth: '100%',
    },
    toText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing(5),
      paddingVertical: spacing(2),
      shadowColor: '#2a1260',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(3),
    },
    rowLabel: { color: colors.textSecondary, fontSize: 14 },
    rowLabelStrong: { color: colors.textPrimary, fontWeight: '700' },
    rowValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.border },
  });
