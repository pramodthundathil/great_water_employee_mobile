import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { post } from './api';

let registeredToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers this device for approval / status push notifications.
 * Remote push needs a development or store build (not Expo Go) and an EAS projectId
 * in app.json (extra.eas.projectId). Failures are silent: in-app notifications still work.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return null;
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null; // Expo Go

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('approvals', {
        name: 'Approvals & status updates',
        importance: AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await post('/devices/register/', {
      registration_token: token,
      device_type: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      device_model: Device.modelName ?? '',
      app_version: Constants.expoConfig?.version ?? '',
    });
    registeredToken = token;
    return token;
  } catch (e) {
    console.warn('Push registration skipped:', e);
    return null;
  }
}

export async function unregisterPush() {
  if (!registeredToken) return;
  try {
    await post('/devices/unregister/', { registration_token: registeredToken });
  } catch {
    // ignore — the server deactivates stale tokens when Expo reports them
  }
  registeredToken = null;
}

/** Maps a portal link_url from a notification to an app route. */
export function routeForLink(link?: string | null): string | null {
  if (!link) return null;
  const exp = /\/expenses\/(?:claims\/)?(\d+)\/?$/.exec(link);
  if (exp) return `/expenses/${exp[1]}`;
  const lv = /\/leaves\/(?:applications\/)?(\d+)\/?$/.exec(link);
  if (lv) return `/leaves/${lv[1]}`;
  if (link.includes('approvals') || link.includes('reimbursements')) return '/approvals';
  return '/notifications';
}
