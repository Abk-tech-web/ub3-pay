import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../config/theme';
import AuthNavigator from './AuthNavigator';
import KycNavigator from './KycNavigator';
import MainTabNavigator from './MainTabNavigator';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bgElevated, border: colors.border, primary: colors.violet },
};

export default function RootNavigator() {
  const { user, authChecked } = useAuth();

  // Wait for Firebase's initial auth check before deciding which stack to
  // show — otherwise every launch briefly flashes the sign-in screen even
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
      ) : user.kycStatus !== 'approved' ? (
        <KycNavigator />
      ) : (
        <MainTabNavigator />
      )}
    </NavigationContainer>
  );
}
