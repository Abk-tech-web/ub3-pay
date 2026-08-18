import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
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
import SellCryptoScreen from '../screens/buysell/SellCryptoScreen';
import WithdrawScreen from '../screens/buysell/WithdrawScreen';
import AirtimeScreen from '../screens/billpay/AirtimeScreen';
import DataScreen from '../screens/billpay/DataScreen';
import WalletSettingsScreen from '../screens/profile/WalletSettingsScreen';

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
      <HomeStack.Screen name="SellCrypto" component={SellCryptoScreen} />
      <HomeStack.Screen name="Withdraw" component={WithdrawScreen} />
      <HomeStack.Screen name="Airtime" component={AirtimeScreen} />
      <HomeStack.Screen name="Data" component={DataScreen} />
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
      <ProfileStack.Screen name="WalletSettings" component={WalletSettingsScreen} />
    </ProfileStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarActiveTintColor: colors.violetSoft,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab" component={HomeStackScreen} options={{ title: 'Wallet',
        tabBarIcon: ({ color, size }) => <Feather name="credit-card" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="SwapTab" component={SwapStackScreen} options={{ title: 'Swap',
        tabBarIcon: ({ color, size }) => <Feather name="repeat" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="NairaTab" component={NairaStackScreen} options={{ title: 'Naira',
        tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ActivityTab" component={ActivityScreen} options={{ title: 'Activity',
        tabBarIcon: ({ color, size }) => <Feather name="activity" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ProfileTab" component={ProfileStackScreen} options={{ title: 'Profile',
        tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
