import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import * as kycService from '../../services/kycService';

const DOC_TYPES = [
  { id: 'nin_slip', label: 'NIN slip' },
  { id: 'drivers_license', label: "Driver's license" },
  { id: 'passport', label: 'International passport' },
];

export default function KycDocumentScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const onUpload = async () => {
    // TODO(integration): expo-image-picker → kycService.submitDocument(selected, imageUri)
    setLoading(true);
    try {
      await kycService.submitDocument(selected, 'mock://uri');
      navigation.navigate('KycLiveness');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Choose an ID type</Text>
        <Text style={styles.subtitle}>A clear photo of one government-issued ID.</Text>

        {DOC_TYPES.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setSelected(d.id)}
            style={[styles.option, selected === d.id && styles.optionSelected]}
          >
            <Text style={styles.optionLabel}>{d.label}</Text>
          </Pressable>
        ))}

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Take photo & continue" onPress={onUpload} loading={loading} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing(6), paddingTop: spacing(10), paddingBottom: spacing(6) },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  option: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard,
    borderRadius: radii.md, padding: spacing(4), marginBottom: spacing(3),
  },
  optionSelected: { borderColor: colors.violet },
  optionLabel: { color: colors.textPrimary, fontWeight: '600' },
});
