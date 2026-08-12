import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../config/theme';
import PrimaryButton from './PrimaryButton';

export default function ConfirmationSheet({ visible, title, rows = [], onConfirm, onCancel, loading }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
          <View style={{ height: spacing(4) }} />
          <PrimaryButton title="Confirm" onPress={onConfirm} loading={loading} />
          <View style={{ height: spacing(2) }} />
          <PrimaryButton title="Cancel" onPress={onCancel} variant="ghost" disabled={loading} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, padding: spacing(6) },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing(4) },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: spacing(4) },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
});
