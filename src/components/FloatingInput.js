import React, { useRef, useState } from 'react';
import { View, TextInput, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../config/theme';

export default function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  autoCapitalize,
  rightElement,
  containerStyle,
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animateTo = (toValue) => {
    Animated.timing(anim, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const onFocus = () => {
    setFocused(true);
    animateTo(1);
  };
  const onBlur = () => {
    setFocused(false);
    if (!value) animateTo(0);
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.violet],
  });

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 8],
  });
  const labelSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, colors.violet],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        containerStyle,
        {
          borderColor,
          shadowOpacity: focused ? 0.35 : 0,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          { top: labelTop, fontSize: labelSize, color: labelColor },
        ]}
      >
        {label}
      </Animated.Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.violet}
        />
        {rightElement}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing(4),
    paddingTop: spacing(6),
    paddingBottom: spacing(2.5),
    marginBottom: spacing(4),
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 0,
  },
  label: {
    position: 'absolute',
    left: spacing(4),
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 0,
    height: 26,
  },
});
