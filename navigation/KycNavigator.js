import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KycIntroScreen from '../screens/kyc/KycIntroScreen';
import KycBvnScreen from '../screens/kyc/KycBvnScreen';
import KycDocumentScreen from '../screens/kyc/KycDocumentScreen';
import KycLivenessScreen from '../screens/kyc/KycLivenessScreen';
import KycStatusScreen from '../screens/kyc/KycStatusScreen';

const Stack = createNativeStackNavigator();

export default function KycNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KycIntro" component={KycIntroScreen} />
      <Stack.Screen name="KycBvn" component={KycBvnScreen} />
      <Stack.Screen name="KycDocument" component={KycDocumentScreen} />
      <Stack.Screen name="KycLiveness" component={KycLivenessScreen} />
      <Stack.Screen name="KycStatus" component={KycStatusScreen} />
    </Stack.Navigator>
  );
}
