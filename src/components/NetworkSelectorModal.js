import React from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../config/theme';
import NetworkIcon from './NetworkIcon';

export default function NetworkSelectorModal({ visible, networks, selectedId, onSelect, onClose }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <FlatList
            data={networks}
            keyExtractor={(n) => n.id}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => {
              const active = item.id === selectedId;
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => { onSelect(item.id); onClose(); }}
                >
                  <NetworkIcon network={item} size={36} />
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <Ionicons name="checkmark" size={16} color={colors.bg} />}
                  </View>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start', paddingTop: 220 },
  sheet: { backgroundColor: colors.bgCard, marginHorizontal: spacing(4), borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing(2), maxHeight: 420 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(4), paddingVertical: spacing(3), gap: spacing(3) },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing(4) },
  name: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: colors.violet, borderColor: colors.violet },
});
