import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../config/theme';

import PortfolioScreen from '../screens/home/PortfolioScreen';
import AssetDetailScreen from '../screens/home/AssetDetailScreen';
import SwapCryptoToNairaScreen from '../screens/swap/SwapCryptoToNairaScreen';
import SwapNairaToCryptoScreen from '../screens/swap/SwapNairaToCryptoScreen';
import SwapConfirmationScreen from '../screens/swap/SwapConfirmationScreen';
import NairaAccountScreen from '../screens/naira/NairaAccountScreen';
import DepositHistoryScreen from '../screens/naira/DepositHistoryScreen';
import ActivityScreen from '../screens/activity/ActivityScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SecuritySettingsScreen from '../screens/profile/SecuritySettingsScreen';
import PinSetupScreen from '../screens/profile/PinSetupScreen';
import ReceiveScreen from '../screens/wallet/ReceiveScreen';
import SendScreen from '../screens/wallet/SendScreen';
import TransactionHistoryScreen from '../screens/wallet/TransactionHistoryScreen';
import AddCustomTokenScreen from '../screens/wallet/AddCustomTokenScreen';
import BuyCryptoScreen from '../screens/buysell/BuyCryptoScreen';
import WithdrawScreen from '../screens/buysell/WithdrawScreen';
import AirtimeDataScreen from '../screens/comingsoon/AirtimeDataScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SwapStack = createNativeStackNavigator();
const NairaStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Portfolio" component={PortfolioScreen} />
      <HomeStack.Screen name="AssetDetail" component={AssetDetailScreen} />
      <HomeStack.Screen name="Receive" component={ReceiveScreen} />
      <HomeStack.Screen name="Send" component={SendScreen} />
      <HomeStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <HomeStack.Screen name="AddCustomToken" component={AddCustomTokenScreen} />
      <HomeStack.Screen name="BuyCrypto" component={BuyCryptoScreen} />
      <HomeStack.Screen name="Withdraw" component={WithdrawScreen} />
      <HomeStack.Screen name="AirtimeData" component={AirtimeDataScreen} />
    </HomeStack.Navigator>
  );
}

function SwapStackScreen() {
  return (
    <SwapStack.Navigator screenOptions={{ headerShown: false }}>
      <SwapStack.Screen name="SwapCryptoToNaira" component={SwapCryptoToNairaScreen} />
      <SwapStack.Screen name="SwapNairaToCrypto" component={SwapNairaToCryptoScreen} />
      <SwapStack.Screen name="SwapConfirmation" component={SwapConfirmationScreen} />
    </SwapStack.Navigator>
  );
}

function NairaStackScreen() {
  return (
    <NairaStack.Navigator screenOptions={{ headerShown: false }}>
      <NairaStack.Screen name="NairaAccount" component={NairaAccountScreen} />
      <NairaStack.Screen name="DepositHistory" component={DepositHistoryScreen} />
    </NairaStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <ProfileStack.Screen name="PinSetup" component={PinSetupScreen} />
    </ProfileStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.violetSoft,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: 'Wallet' }} />
      <Tab.Screen name="SwapTab" component={SwapStackScreen} options={{ title: 'Swap' }} />
      <Tab.Screen name="NairaTab" component={NairaStackScreen} options={{ title: 'Naira' }} />
      <Tab.Screen name="ActivityTab" component={ActivityScreen} options={{ title: 'Activity' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
