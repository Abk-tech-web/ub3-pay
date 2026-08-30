import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing } from '../config/theme';
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={28} color="#5B3FD1" />
          </View>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.card}>
            {rows.map((r, i) => (
              <View key={r.label}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  <Text style={styles.rowValue}>{r.value}</Text>
                </View>
                {i < rows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={{ height: spacing(5) }} />
          <PrimaryButton title="Confirm" onPress={onConfirm} loading={loading} />
          <View style={{ height: spacing(3) }} />
          <PrimaryButton title="Cancel" onPress={onCancel} variant="ghost" disabled={loading} />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.lg + 6,
    borderTopRightRadius: radii.lg + 6,
    padding: spacing(7),
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#efe9fc',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing(3),
  },
  title: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing(6),
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(5),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing(3),
  },
  rowLabel: { color: colors.textSecondary, fontSize: 14 },
  rowValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
});
