import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import KycNavigator from './KycNavigator';
import MainTabNavigator from './MainTabNavigator';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';

export default function RootNavigator() {
  const { user, authChecked } = useAuth();
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.bgElevated,
      border: colors.border,
      primary: colors.violet,
      text: colors.textPrimary,
    },
  };

  // Wait for Firebase's initial auth check before deciding which stack to
  // show - otherwise every launch briefly flashes the sign-in screen even
  // for someone with a persisted session.
  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.violetSoft} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthNavigator />
      ) : !user.emailVerified ? (
        <VerifyEmailScreen route={{ params: { email: user.email } }} />
      ) : (
        <MainTabNavigator />
      )}
    </NavigationContainer>
  );
}
