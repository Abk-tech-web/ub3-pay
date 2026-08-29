import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CustomTabBar from '../components/CustomTabBar';

import PortfolioScreen from '../screens/home/PortfolioScreen';
import AssetDetailScreen from '../screens/home/AssetDetailScreen';
import NairaDetailScreen from '../screens/wallet/NairaDetailScreen';
import NairaWithdrawScreen from '../screens/wallet/WithdrawScreen';
import BankAccountScreen from '../screens/wallet/BankAccountScreen';
import VerifyBvnScreen from '../screens/wallet/VerifyBvnScreen';
import WithdrawAmountScreen from '../screens/wallet/WithdrawAmountScreen';
import ConfirmPinScreen from '../screens/wallet/ConfirmPinScreen';
import WithdrawSuccessScreen from '../screens/wallet/WithdrawSuccessScreen';
import TransactionReceiptScreen from '../screens/wallet/TransactionReceiptScreen';
import SwapCryptoToNairaScreen from '../screens/swap/SwapCryptoToNairaScreen';
import SwapScreen from '../screens/swap/SwapScreen';
import SwapNairaToCryptoScreen from '../screens/swap/SwapNairaToCryptoScreen';
import SwapConfirmationScreen from '../screens/swap/SwapConfirmationScreen';
import NairaAccountScreen from '../screens/naira/NairaAccountScreen';
import DepositHistoryScreen from '../screens/naira/DepositHistoryScreen';
import ActivityScreen from '../screens/activity/ActivityScreen';
import TransactionDetailScreen from '../screens/activity/TransactionDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SecuritySettingsScreen from '../screens/profile/SecuritySettingsScreen';
import PinSetupScreen from '../screens/profile/PinSetupScreen';
import ReceiveScreen from '../screens/wallet/ReceiveScreen';
import ReceiveNetworkScreen from '../screens/wallet/ReceiveNetworkScreen';
import ReceiveSelectScreen from '../screens/wallet/ReceiveSelectScreen';
import SendScreen from '../screens/wallet/SendScreen';
import SendSelectScreen from '../screens/wallet/SendSelectScreen';
import NetworkPickerScreen from '../screens/wallet/NetworkPickerScreen';
import TransactionHistoryScreen from '../screens/wallet/TransactionHistoryScreen';
import AddCustomTokenScreen from '../screens/wallet/AddCustomTokenScreen';
import BuyCryptoScreen from '../screens/buysell/BuyCryptoScreen';
import SellCryptoScreen from '../screens/buysell/SellCryptoScreen';
import WithdrawScreen from '../screens/buysell/WithdrawScreen';
import AirtimeScreen from '../screens/billpay/AirtimeScreen';
import DataScreen from '../screens/billpay/DataScreen';
import ConfirmPurchaseScreen from '../screens/billpay/ConfirmPurchaseScreen';
import BillConfirmPinScreen from '../screens/billpay/BillConfirmPinScreen';
import WalletSettingsScreen from '../screens/profile/WalletSettingsScreen';

const Tab = createBottomTabNavigator();
const ActivityStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const SwapStack = createNativeStackNavigator();
const NairaStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Portfolio" component={PortfolioScreen} />
      <HomeStack.Screen name="AssetDetail" component={AssetDetailScreen} />
      <HomeStack.Screen name="NairaDetail" component={NairaDetailScreen} />
      <HomeStack.Screen name="NairaWithdraw" component={NairaWithdrawScreen} />
      <HomeStack.Screen name="BankAccount" component={BankAccountScreen} />
        <HomeStack.Screen name="VerifyBvn" component={VerifyBvnScreen} />
      <HomeStack.Screen name="WithdrawAmount" component={WithdrawAmountScreen} />
      <HomeStack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <HomeStack.Screen name="WithdrawSuccess" component={WithdrawSuccessScreen} />
      <HomeStack.Screen name="TransactionReceipt" component={TransactionReceiptScreen} />
      <HomeStack.Screen name="Receive" component={ReceiveSelectScreen} />
      <HomeStack.Screen name="ReceiveAddress" component={ReceiveScreen} />
      <HomeStack.Screen name="ReceiveNetwork" component={ReceiveNetworkScreen} />
      <HomeStack.Screen name="Send" component={SendSelectScreen} />
      <HomeStack.Screen name="SendAmount" component={SendScreen} />
      <HomeStack.Screen name="NetworkPicker" component={NetworkPickerScreen} />
      <HomeStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <HomeStack.Screen name="AddCustomToken" component={AddCustomTokenScreen} />
      <HomeStack.Screen name="BuyCrypto" component={BuyCryptoScreen} />
      <HomeStack.Screen name="SellCrypto" component={SellCryptoScreen} />
      <HomeStack.Screen name="Withdraw" component={WithdrawScreen} />
      <HomeStack.Screen name="Airtime" component={AirtimeScreen} />
      <HomeStack.Screen name="Data" component={DataScreen} />
      <HomeStack.Screen name="ConfirmPurchase" component={ConfirmPurchaseScreen} />
      <HomeStack.Screen name="BillConfirmPin" component={BillConfirmPinScreen} />
    </HomeStack.Navigator>
  );
}

function SwapStackScreen() {
  return (
    <SwapStack.Navigator screenOptions={{ headerShown: false }}>
      <SwapStack.Screen name="Swap" component={SwapScreen} />
      <SwapStack.Screen name="SwapCryptoToNaira" component={SwapCryptoToNairaScreen} />
      <SwapStack.Screen name="SwapNairaToCrypto" component={SwapNairaToCryptoScreen} />
      <SwapStack.Screen name="SwapConfirmation" component={SwapConfirmationScreen} />
      <SwapStack.Screen name="TransactionReceipt" component={TransactionReceiptScreen} />
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

function ActivityStackScreen() {
  return (
    <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivityStack.Screen name="ActivityList" component={ActivityScreen} />
      <ActivityStack.Screen name="TransactionReceipt" component={TransactionReceiptScreen} />
      <ActivityStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </ActivityStack.Navigator>
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
  const { colors } = useTheme();
  return (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
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
        name="ActivityTab" component={ActivityStackScreen} options={{ title: 'History',
        tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ProfileTab" component={ProfileStackScreen} options={{ title: 'Profile',
        tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
