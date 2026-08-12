import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../config/theme';
import AuthNavigator from './AuthNavigator';
import KycNavigator from './KycNavigator';
import MainTabNavigator from './MainTabNavigator';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bgElevated, border: colors.border, primary: colors.violet },
};

export default function RootNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? <AuthNavigator /> : user.kycStatus !== 'approved' ? <KycNavigator /> : <MainTabNavigator />}
    </NavigationContainer>
  );
}
