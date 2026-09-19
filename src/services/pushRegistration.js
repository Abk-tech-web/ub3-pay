import { Platform } from 'react-native';
import { apiPost } from './api';

let handlerSet = false;

export async function registerForPush() {
  try {
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');
    const Constants = require('expo-constants').default;
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }
    if (!Device.isDevice) return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;
    const projectId =
      (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.eas && Constants.expoConfig.extra.eas.projectId) ||
      (Constants.easConfig && Constants.easConfig.projectId);
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await apiPost('/push-token', { token });
    return token;
  } catch (e) {
    return null;
  }
}
