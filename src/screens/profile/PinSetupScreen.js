import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';
import { isValidPin } from '../../utils/validators';

export default function PinSetupScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const onSave = () => {
    setError('');
    if (!isValidPin(pin)) return setError('PIN must be 6 digits.');
    if (pin !== confirmPin) return setError('PINs don\u2019t match.');
    // TODO(integration): store PIN hash via expo-secure-store, never plaintext
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Set a transaction PIN</Text>
        <Text style={styles.subtitle}>Required to confirm sends and swaps.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="New PIN"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={pin}
          onChangeText={setPin}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm PIN"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={confirmPin}
          onChangeText={setConfirmPin}
        />

        <View style={{ flex: 1 }} />
        <PrimaryButton title="Save PIN" onPress={onSave} disabled={pin.length !== 6 || confirmPin.length !== 6} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(10) },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing(2), marginBottom: spacing(8) },
  input: {
    backgroundColor: colors.bgCard, color: colors.textPrimary, borderRadius: radii.md,
    paddingHorizontal: spacing(4), height: 52, marginBottom: spacing(4),
    borderWidth: 1, borderColor: colors.border, letterSpacing: 8, textAlign: 'center',
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing(3) },
});
